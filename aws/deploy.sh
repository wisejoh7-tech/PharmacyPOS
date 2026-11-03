#!/usr/bin/env bash
set -e

# ==============================================================================
# Pharmacy System AWS Deployment Automation Script
# Components:
#   - Django Backend -> Amazon ECR & AWS App Runner
#   - React Frontend -> Amazon S3 & CloudFront Distribution
#   - Database -> Amazon RDS PostgreSQL
# ==============================================================================

# Default configurations (Override with env vars if desired)
AWS_REGION=${AWS_REGION:-"us-east-1"}
STACK_NAME=${STACK_NAME:-"pharmacy-production"}
ENVIRONMENT_NAME=${ENVIRONMENT_NAME:-"production"}
DB_USERNAME=${DB_USERNAME:-"pharmacyadmin"}
DB_PASSWORD=${DB_PASSWORD:-""}
DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY:-""}

echo "=========================================================="
echo " Starting AWS Deployment for Pharmacy Application"
echo " Region: ${AWS_REGION}"
echo " Stack:  ${STACK_NAME}"
echo "=========================================================="

# Check prerequisites
command -v aws >/dev/null 2>&1 || { echo >&2 "Error: aws CLI is required but not installed. Aborting."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo >&2 "Error: docker is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo >&2 "Error: npm is required but not installed. Aborting."; exit 1; }

# Prompt for database password and secret key if not provided
if [ -z "$DB_PASSWORD" ]; then
    read -s -p "Enter PostgreSQL Master Password (min 8 chars): " DB_PASSWORD
    echo ""
fi

if [ -z "$DJANGO_SECRET_KEY" ]; then
    DJANGO_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))" 2>/dev/null || openssl rand -base64 36)
    echo "Generated Django SECRET_KEY."
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: ${ACCOUNT_ID}"

# Step 1: Deploy or Update CloudFormation Base Stack (VPC, RDS, ECR, S3, CloudFront)
echo ""
echo "--> [1/4] Deploying/Verifying CloudFormation Base Stack..."
aws cloudformation deploy \
    --template-file aws/cloudformation.yaml \
    --stack-name "${STACK_NAME}" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "${AWS_REGION}" \
    --parameter-overrides \
        EnvironmentName="${ENVIRONMENT_NAME}" \
        DBUsername="${DB_USERNAME}" \
        DBPassword="${DB_PASSWORD}" \
        DjangoSecretKey="${DJANGO_SECRET_KEY}"

# Retrieve stack outputs
ECR_REPO_URI=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${AWS_REGION}" --query "Stacks[0].Outputs[?OutputKey=='ECRRepositoryUri'].OutputValue" --output text)
S3_BUCKET=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${AWS_REGION}" --query "Stacks[0].Outputs[?OutputKey=='FrontendS3BucketName'].OutputValue" --output text)
CF_DIST_ID=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${AWS_REGION}" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text)
CF_DOMAIN=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${AWS_REGION}" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" --output text)

echo "ECR Repo:    ${ECR_REPO_URI}"
echo "S3 Bucket:   ${S3_BUCKET}"
echo "CloudFront:  https://${CF_DOMAIN} (Distribution: ${CF_DIST_ID})"

# Step 2: Build and Push Backend Docker Image to Amazon ECR
echo ""
echo "--> [2/4] Building and pushing Django API Backend Docker image..."
IMAGE_TAG="latest"
BACKEND_IMAGE_URI="${ECR_REPO_URI}:${IMAGE_TAG}"

aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
docker build -t "${BACKEND_IMAGE_URI}" -f backend/Dockerfile backend/
docker push "${BACKEND_IMAGE_URI}"

# Step 3: Deploy / Update CloudFormation with the Backend Image URI for App Runner
echo ""
echo "--> [3/4] Updating App Runner Service with the new image..."
aws cloudformation deploy \
    --template-file aws/cloudformation.yaml \
    --stack-name "${STACK_NAME}" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "${AWS_REGION}" \
    --parameter-overrides \
        EnvironmentName="${ENVIRONMENT_NAME}" \
        DBUsername="${DB_USERNAME}" \
        DBPassword="${DB_PASSWORD}" \
        DjangoSecretKey="${DJANGO_SECRET_KEY}" \
        BackendImageUri="${BACKEND_IMAGE_URI}"

APP_RUNNER_URL=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${AWS_REGION}" --query "Stacks[0].Outputs[?OutputKey=='AppRunnerServiceUrl'].OutputValue" --output text)
API_URL="https://${APP_RUNNER_URL}/api"
echo "App Runner URL: https://${APP_RUNNER_URL}"

# Step 4: Build and Deploy Frontend to S3 and Invalidate CloudFront
echo ""
echo "--> [4/4] Building and Deploying React Frontend..."
cd pharmacy
npm install
VITE_API_URL="${API_URL}" npm run build

echo "Syncing frontend files to S3 bucket ${S3_BUCKET}..."
aws s3 sync dist/ "s3://${S3_BUCKET}/" --delete

echo "Invalidating CloudFront cache (${CF_DIST_ID})..."
aws cloudfront create-invalidation --distribution-id "${CF_DIST_ID}" --paths "/*" >/dev/null
cd ..

echo ""
echo "=========================================================="
echo " Deployment Successfully Completed!"
echo " Frontend App: https://${CF_DOMAIN}"
echo " Backend API:  https://${APP_RUNNER_URL}/api/"
echo " Health Check: https://${APP_RUNNER_URL}/health/"
echo "=========================================================="
