# AWS Deployment Guide: S3, CloudFront, App Runner & Amazon RDS

This document provides a complete guide for deploying the **Pharmacy Management System** to Amazon Web Services (AWS) using the requested modern architecture:
- **Frontend**: AWS S3 + AWS CloudFront (React, Vite, HTTPS, Single Page App Routing)
- **Backend API**: AWS App Runner (Django REST Framework with Gunicorn in Docker)
- **Database**: Amazon RDS PostgreSQL (Managed relational database in private subnets)

---

## Architecture Overview

```
                      +-----------------------------+
                      |         End Users           |
                      +--------------+--------------+
                                     |
               HTTPS (Static Assets) | HTTPS (API Requests)
                                     v
+------------------------+      +-------------------------------+
|     AWS CloudFront     |      |        AWS App Runner         |
|   (Global CDN / TLS)   |      |  (Django REST API / Gunicorn) |
+-----------+------------+      +---------------+---------------+
            |                                   |
            | OAC (Origin Access Control)       | VPC Connector
            v                                   v
+------------------------+      +-------------------------------+
|     Amazon S3 Bucket   |      |      Amazon RDS PostgreSQL    |
| (React/Vite Production |      |  (Automated Backups, Multi-AZ)|
|        Bundle)         |      +-------------------------------+
+------------------------+
```

---

## 1. Quick Start: Automated Deployment

### Option A: Using the Automated Script (`aws/deploy.sh`)

Ensure you have the [AWS CLI](https://aws.amazon.com/cli/), [Docker](https://www.docker.com/), and [Node.js](https://nodejs.org/) installed and authenticated (`aws configure`).

```bash
# Make executable (if not already)
chmod +x aws/deploy.sh

# Run deployment
./aws/deploy.sh
```

The script performs:
1. Deploys the CloudFormation base stack (VPC, Subnets, RDS PostgreSQL, ECR repository, S3 bucket, CloudFront distribution).
2. Builds and pushes the Django backend Docker image to Amazon ECR.
3. Updates the AWS App Runner service with the new image.
4. Builds the React frontend with the App Runner API URL and uploads to S3.
5. Invalidates the CloudFront cache.

---

### Option B: GitHub Actions CI/CD Pipeline

The repository includes a ready-to-run GitHub Actions workflow at `.github/workflows/deploy-aws.yml`.

To enable automated deployment on every commit to `main`:
1. In your GitHub repository, navigate to **Settings > Secrets and variables > Actions**.
2. Add the following repository secrets:
   - `AWS_ACCESS_KEY_ID`: IAM user access key with deployment permissions.
   - `AWS_SECRET_ACCESS_KEY`: IAM user secret access key.
   - `DB_PASSWORD`: Strong password for RDS PostgreSQL (min 8 characters).
   - `DJANGO_SECRET_KEY`: Random 50+ character string for Django production security.

Whenever you push to `main` (or run manually via Workflow Dispatch), the pipeline will automatically build and deploy both backend and frontend.

---

## 2. Step-by-Step Manual Deployment Guide

If you prefer deploying or customizing components manually via the AWS Management Console or AWS CLI, follow these steps.

### Step 1: Deploy Database (Amazon RDS PostgreSQL)
1. Go to **Amazon RDS Console > Create database**.
2. Choose **Standard create > PostgreSQL** (version 15 or 16).
3. Template: **Free tier** (or **Production** for Multi-AZ redundancy).
4. DB instance identifier: `pharmacy-db`.
5. Master username: `pharmacyadmin`.
6. Master password: `<your_secure_password>`.
7. Instance configuration: `db.t4g.micro` or `db.t3.micro`.
8. Storage: 20 GB gp3.
9. Connectivity:
   - VPC: Default or custom VPC with at least two subnets.
   - Public access: **No** (best security practice).
   - VPC Security Group: Create new, allowing inbound PostgreSQL (port 5432) from the App Runner VPC connector security group.
10. Initial database name under *Additional configuration*: `pharmacy`.
11. Note down the **RDS Endpoint Address** once created (e.g., `pharmacy-db.xxxxx.us-east-1.rds.amazonaws.com`).

---

### Step 2: Build & Push Backend Container to Amazon ECR
1. Create an ECR repository:
   ```bash
   aws ecr create-repository --repository-name pharmacy-backend --region us-east-1
   ```
2. Log in Docker to your ECR registry:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
   ```
3. Build the backend image from the repo root:
   ```bash
   docker build -t pharmacy-backend -f backend/Dockerfile backend/
   ```
4. Tag and push to ECR:
   ```bash
   docker tag pharmacy-backend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/pharmacy-backend:latest
   docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/pharmacy-backend:latest
   ```

---

### Step 3: Deploy AWS App Runner Service
1. In the **AWS App Runner Console**, click **Create service**.
2. **Source**: Container registry -> Amazon ECR.
   - Select `<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/pharmacy-backend:latest`.
   - Deployment trigger: Automatic (on push) or Manual.
   - ECR access role: Create a new service role or use existing.
3. **Service configuration**:
   - Service name: `pharmacy-backend`.
   - Port: `8000`.
   - Environment variables:
     | Variable | Example Value |
     |---|---|
     | `DEBUG` | `False` |
     | `SECRET_KEY` | `<your_generated_secret_key>` |
     | `DATABASE_URL` | `postgres://pharmacyadmin:<password>@<rds_endpoint>:5432/pharmacy` |
     | `DB_SSL_REQUIRE` | `False` (for VPC private connection) or `True` |
     | `ALLOWED_HOSTS` | `*` |
     | `CORS_ALLOW_ALL_ORIGINS` | `True` |
     | `SECURE_SSL_REDIRECT` | `False` |
     | `SESSION_COOKIE_SECURE` | `True` |
     | `CSRF_COOKIE_SECURE` | `True` |
4. **Networking**:
   - Outgoing network traffic: **Custom VPC**.
   - Create or select an App Runner **VPC Connector** attached to the same VPC and subnets where your RDS instance resides.
5. **Health check**:
   - Protocol: `HTTP`
   - Path: `/health/`
   - Interval: `10` seconds, Timeout: `5` seconds.
6. Click **Create & deploy**. Note down the App Runner Service URL (e.g., `https://abc123xyz.us-east-1.awsapprunner.com`).

---

### Step 4: Deploy Frontend (Amazon S3 + CloudFront)
1. **Create S3 Bucket**:
   - Bucket name: e.g., `pharmacy-frontend-<account-id>`.
   - Block *all* public access: **Enabled** (CloudFront accesses it securely via OAC).
2. **Create CloudFront Distribution**:
   - Origin domain: Select your S3 bucket.
   - Origin access: **Origin access control (OAC)** (create and attach OAC).
   - Viewer protocol policy: **Redirect HTTP to HTTPS**.
   - Allowed HTTP methods: `GET, HEAD, OPTIONS`.
3. **Single Page Application (SPA) Routing Configuration**:
   - In CloudFront Distribution Settings > **Error pages**:
     - Create Custom Error Response:
       - HTTP error code: `403: Forbidden`
       - Customize error response: `Yes`
       - Response page path: `/index.html`
       - HTTP Response code: `200: OK`
     - Create Custom Error Response:
       - HTTP error code: `404: Not Found`
       - Customize error response: `Yes`
       - Response page path: `/index.html`
       - HTTP Response code: `200: OK`
4. **Attach S3 Bucket Policy**:
   Update your S3 bucket policy to grant read access to CloudFront:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowCloudFrontOAC",
         "Effect": "Allow",
         "Principal": {
           "Service": "cloudfront.amazonaws.com"
         },
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::pharmacy-frontend-<account-id>/*",
         "Condition": {
           "StringEquals": {
             "AWS:SourceArn": "arn:aws:cloudfront::<account-id>:distribution/<distribution-id>"
           }
         }
       }
     ]
   }
   ```
5. **Build and Upload Frontend Assets**:
   ```bash
   cd pharmacy
   npm install
   # Set the App Runner API endpoint
   VITE_API_URL="https://<apprunner-url>.awsapprunner.com/api" npm run build
   aws s3 sync dist/ s3://pharmacy-frontend-<account-id>/ --delete
   aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
   ```

---

## 3. Alternative Backend: AWS ECS Fargate

If you prefer AWS ECS Fargate instead of AWS App Runner:
1. Create an ECS Cluster (Fargate type).
2. Define an ECS Task Definition pointing to your backend ECR image on port 8000, passing the same environment variables (`DATABASE_URL`, `SECRET_KEY`, etc.).
3. Create an Application Load Balancer (ALB) with an HTTPS listener and target group forwarding to port 8000.
4. Point the target group health check to `/health/`.
5. Point your frontend's `VITE_API_URL` to your ALB's HTTPS domain name or custom domain.

---

## 4. Database Migrations & Initial Admin Setup

The backend container includes an automated `backend/entrypoint.sh` startup script. On every boot or deployment:
1. It automatically runs schema synchronization and migrations via `run_migrations.py` (with fallback to `manage.py migrate --noinput`).
2. It automatically executes `ensure_admin.py` to create initial administrative accounts if configured via `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
3. It collects static files with `manage.py collectstatic --noinput`.

If you ever need to run migrations manually against RDS:
```bash
cd backend
DATABASE_URL="postgres://pharmacyadmin:<password>@<rds_endpoint>:5432/pharmacy" python manage.py migrate
```

---

## 5. Security & Production Checklist

1. **Keep RDS Private**: Do not enable public accessibility on your database. Keep it in private subnets and connect through the App Runner VPC Connector or ECS private tasks.
2. **Rotate Passwords & Keys**: Never commit production `SECRET_KEY` or `DB_PASSWORD` into Git. Use AWS Systems Manager Parameter Store, AWS Secrets Manager, or GitHub Actions Secrets.
3. **Custom Domains & SSL**: Use **AWS Certificate Manager (ACM)** for custom domains (e.g. `pharmacy.yourdomain.com` on CloudFront and `api.yourdomain.com` on App Runner / ALB).
4. **CORS Whitelisting**: Ensure your CloudFront distribution domain or custom domain is present in `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`.
