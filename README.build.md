# Building New Light Medicine and Store Multi-Platform Apps

This guide explains how to generate the **Windows (.exe)** and **Android (.apk)** versions of the application.

## Prerequisites
- **Flutter SDK**: Ensure Flutter is installed and accessible.
- **Android SDK**: Ensure Android build tools are installed.
- **Node.js**: Required for the web/Render deployment.

## 1. Windows & Android Builds (via Flutter)
Run the automated build script to generate both platforms at once:

```powershell
.\build_dist.ps1
```

- **Android APK**: Found at `app-release.apk` in the root folder.
- **Windows EXE**: Found in the `release-windows\` folder.

## 2. Web Deployment (Render)
The project is configured for [Render](https://render.com).
- Connect your GitHub repository to Render.
- Render will automatically detect the `render.yaml` file.
- It will deploy:
    - **pharmacy-api** (Django Backend)
    - **pharmacy-socket** (Node.js Socket Server)
    - **pharmacy-frontend** (React Frontend)

## 3. Local Development (Port 8000)
If you encounter a port permission error, always ensure you are running the backend on port **8000** (default):

```powershell
python manage.py runserver 8000
```

> [!TIP]
> To run on port 80, you must open PowerShell as an **Administrator**.
