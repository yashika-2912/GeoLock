# Welcome to Your Miaoda Project
Miaoda Application Link URL
    URL:https://medo.dev/projects/app-9u0cqizefu2p

# Secure Geo-Fencing QR Access System with AI Alerts

A full-stack web application that enables users to upload documents securely and grant access via QR codes. Access is restricted by geo-location, time limits, and optional OTP verification. The system integrates Ollama LLM locally to generate real-time AI-powered alerts and summaries.

## Features

### 🔐 Security Features
- **Document Encryption**: All uploaded documents are encrypted before storage
- **Geo-Fencing**: Restrict document access to specific geographic locations
- **Time-Based Access**: Set expiration times for QR codes
- **OTP Verification**: Optional one-time password for additional security
- **Password Protection**: Add password requirements for sensitive documents
- **Access Revocation**: Instantly revoke access to documents
- **Self-Destruct**: Deactivate documents permanently

### 📊 Monitoring & Analytics
- **Real-Time Access Logs**: Monitor all access attempts in real-time
- **AI-Powered Alerts**: Ollama LLM generates intelligent alerts for suspicious activity
- **Location Tracking**: View geographic locations of access attempts
- **Access Analytics**: Track granted and denied access attempts

### 👥 User Management
- **Role-Based Access Control**: Three roles - Admin, Owner, and Viewer
- **Admin Panel**: Manage users and change roles
- **First User Auto-Admin**: First registered user automatically becomes admin

### 📱 User Experience
- **QR Code Generation**: Automatic QR code generation for each document
- **QR Code Scanning**: Easy scanning interface for document access
- **Document Preview**: View documents directly in the browser
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime subscriptions
- **AI**: Ollama LLM integration
- **Authentication**: Supabase Auth (username + password)

## Getting Started

### Prerequisites

1. **Ollama Installation** (for AI alerts):
   ```bash
   # Install Ollama from https://ollama.ai
   # Pull the llama2 model
   ollama pull llama2
   ```

2. **Configure Ollama URL**:
   - After the application starts, you'll be prompted to configure the Ollama API URL
   - For local installation: `http://localhost:11434`
   - For hosted Ollama: Enter your server URL

### First Time Setup

1. **Register First User**:
   - Navigate to the Register page
   - Create your account (first user becomes admin automatically)
   - You'll be automatically logged in

2. **Upload Your First Document**:
   - Go to Dashboard → Upload tab
   - Select a document (PDF, images, or Office documents)
   - Configure access restrictions:
     - **Geo-Fencing**: Enable and set allowed location + radius
     - **Time Expiry**: Set how long the QR code remains valid
     - **OTP**: Require one-time password for access
     - **Password**: Add password protection
   - Click "Upload Document & Generate QR Code"

3. **Share QR Code**:
   - Go to Dashboard → Documents tab
   - Click "View QR Code" on your document
   - Share the QR code or URL with intended recipients

4. **Access Document via QR**:
   - Recipients scan the QR code or visit the URL
   - System validates:
     - Geographic location (if geo-fencing enabled)
     - Time window (if expiry set)
     - OTP (if required)
     - Password (if set)
   - If all checks pass, document is displayed

5. **Monitor Access**:
   - Go to Dashboard → Access Logs tab
   - View real-time access attempts
   - Check Dashboard → AI Alerts tab for suspicious activity

## User Roles

### Viewer (Default)
- Can scan QR codes and view documents they have access to
- Cannot upload documents

### Owner
- All Viewer permissions
- Can upload and manage their own documents
- Can generate QR codes
- Can view access logs for their documents
- Can revoke access

### Admin
- All Owner permissions
- Can manage all users
- Can change user roles
- Can view all documents and logs
- Access to Admin panel

## Security Best Practices

1. **Geo-Fencing**: Use for location-sensitive documents
2. **Time Limits**: Set appropriate expiration times
3. **OTP**: Enable for highly sensitive documents
4. **Password**: Add an extra layer of security
5. **Monitor Logs**: Regularly check access logs and AI alerts
6. **Revoke Access**: Immediately revoke compromised QR codes

## AI Alert System

The system uses Ollama LLM to analyze access attempts and generate intelligent alerts:

- **Suspicious Location**: Access attempts from unexpected locations
- **Time Anomalies**: Access outside expected time windows
- **Multiple Failures**: Repeated failed access attempts
- **Pattern Detection**: AI identifies unusual access patterns

## API Endpoints

### Edge Functions

1. **validate-access**: Validates QR code access with all security checks
2. **generate-otp**: Generates one-time passwords for documents
3. **ai-alerts**: Processes access logs and generates AI-powered alerts

## Database Schema

- **profiles**: User profiles with roles
- **documents**: Encrypted document metadata
- **qr_codes**: QR code configurations and restrictions
- **access_logs**: Complete audit trail of access attempts

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## Common Issues & Troubleshooting

### QR Code Validation Errors

If you see validation errors when scanning a QR code, check the following:

1. **Password Required**: If the document is password-protected, you'll need to enter the password
2. **OTP Required**: If OTP is enabled, request an OTP from the document owner
3. **Location Error**: Ensure your browser has location permissions enabled
4. **Geo-Fencing**: You must be within the allowed radius of the specified location
5. **Expired**: Check if the QR code has passed its expiration time

### Error Messages Explained

- **"Password required but not provided"**: The document requires a password. Click the password dialog and enter it.
- **"Location outside allowed radius"**: You're too far from the allowed location. Move closer or contact the document owner.
- **"QR code has expired"**: The access period has ended. Request a new QR code from the owner.
- **"OTP required but not provided"**: Click "Request OTP" to get a one-time password.

## Support

For issues or questions:
1. Check the access logs for detailed error messages
2. Verify Ollama is running for AI features
3. Ensure location permissions are granted in browser
4. Check that QR code hasn't expired

## License

© 2026 Secure Geo-Fencing QR Access System

---

**Note**: This is a demonstration system. For production use, implement proper encryption, secure key management, and additional security measures.
