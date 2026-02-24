# Secure Geo-Fencing QR Access System with AI Alerts Requirements Document

## 1. Application Overview

### 1.1 Application Name
Secure Geo-Fencing QR Access System with AI Alerts

### 1.2 Application Description
A full-stack web application that enables users to upload documents securely and grant access via QR codes. Access is restricted by geo-location, time limits, and optional OTP verification. The system integrates Ollama LLM locally to generate real-time AI-powered alerts and summaries.

## 2. Core Features

### 2.1 User Management
- User registration and login
- User logout functionality
- Role-based access control: Owner and Viewer roles

### 2.2 Document Upload and Storage
- Upload PDF, image, and document files
- Backend file encryption
- Store files in Azure Blob Storage or local storage for demo

### 2.3 QR Code Generation
- Generate unique QR code for each document access
- Store metadata including document ID, allowed geo-location, and expiry time
- Optional OTP or password requirement configuration

### 2.4 QR Code Scanning and Access Control
- Validate device location using geo-fencing
- Validate time window for access
- Validate OTP or password if enabled
- Grant or deny access based on validation results

### 2.5 Dashboard and Access Logs
- Display real-time access logs showing who accessed, when, and where
- Show granted and denied access attempts
- Live updates for demonstration purposes

### 2.6 Security Features
- AES encryption for documents
- OTP delivery via email or SMS
- Optional watermarking with viewer name and timestamp
- Self-destruct and revoke access capabilities
- Secure storage of secrets in environment variables

### 2.7 AI Integration with Ollama
- Generate alerts for suspicious QR scan attempts
- Summarize access logs
- Run locally without cloud dependency

## 3. Technical Architecture

### 3.1 Frontend Structure
- Components: UploadForm, QRScanner, Dashboard, MapViewer
- Pages: Login, Register, UploadPage, AccessPage
- Services: API service, Authentication service

### 3.2 Backend Structure
- Controllers: qrController, documentController, otpController
- Models: User, Document, AccessLog
- Routes: userRoutes, documentRoutes, accessRoutes
- Utilities: encryption, geoCheck, qrGenerator
- Ollama integration: ollamaHelper
- Configuration: database connection

### 3.3 Deployment Environment
- Full-stack hosted on Azure
- Database: MongoDB or Cosmos DB
- Storage: Azure Blob Storage
- Optional: Azure Functions for OTP and QR generation

## 4. User Flow

### 4.1 Document Owner Flow
1. Owner uploads document, which is encrypted and stored
2. System generates QR code containing document ID, allowed location, and expiry time
3. Owner can configure access restrictions including geo-location, time limits, and OTP requirements
4. Owner can monitor access attempts in real-time dashboard
5. Owner can revoke access or trigger self-destruct for documents

### 4.2 Document Viewer Flow
1. Viewer scans QR code
2. Backend validates location, time window, and OTP if required
3. If validation passes, document is decrypted and displayed
4. If validation fails, access is denied and AI alert is generated
5. Access attempt is logged and displayed in owner dashboard

## 5. AI Alert Integration

### 5.1 Alert Triggers
- QR scan attempts outside allowed geo-location
- Access attempts outside valid time window
- Multiple failed access attempts
- Suspicious access patterns

### 5.2 Alert Generation
- Ollama LLM processes access log data
- Generates contextual alert messages
- Provides log summaries for dashboard display