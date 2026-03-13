# Privacy Risk Analyzer

Privacy Risk Analyzer is a full-stack web application for identifying sensitive data exposure risk across data assets.

It helps teams:

- Catalog data assets and map PII fields
- Manage role-based access permissions
- Apply security controls (encryption, masking, hashing)
- Analyze and track risk levels
- Monitor activity through audit logs

## Tech Stack

### Frontend

- React (Vite)
- React Router
- Axios

### Backend

- Node.js
- Express
- PostgreSQL (pg)
- JWT authentication

## Project Structure

- backend/: Express API, database schema, business logic
- frontend/: React UI and client-side routing

## Core Features

- Authentication and authorization
    - Login/register flow
    - JWT-protected API routes
    - Role-driven access
- Asset and PII management
    - Create/manage data assets
    - Define PII types and weights
    - Map PII types to assets/columns
- Permission management
    - Assign READ/WRITE/UPDATE/DELETE access by role and asset
- Security controls
    - Enable/disable encryption, masking, hashing per asset
- Risk analysis
    - Compute risk scores and risk levels
- Audit logs
    - Track user activity and filter logs

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+
- PostgreSQL 14+ (recommended)

## Backend Setup

1. Open a terminal in backend/
2. Install dependencies:

    npm install

3. Configure environment variables by creating backend/.env:

    PORT=5000
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=privacy_risk_analyzer
    DB_USER=postgres
    DB_PASSWORD=your_password
    JWT_SECRET=your_jwt_secret

4. Ensure the PostgreSQL database in DB_NAME exists.
5. Start the backend server:

    npm run dev

On startup, the backend initializes schema and baseline role data if needed.

## Frontend Setup

1. Open a terminal in frontend/
2. Install dependencies:

    npm install

3. Start the frontend app:

    npm run dev

Frontend runs on Vite default port (usually 5173) and calls the backend at:

- http://localhost:5000/api

## Default API and Health Check

- API base: /api
- Health endpoint: http://localhost:5000/health

## Main API Modules

The backend exposes route groups for:

- /api/auth
- /api/users
- /api/roles
- /api/assets
- /api/pii
- /api/asset-pii
- /api/permissions
- /api/security-controls
- /api/risk
- /api/audit

## Database Notes

Database schema is defined in backend/schema.sql and includes:

- users, roles
- data_assets, pii_types, asset_pii_mapping
- access_permissions
- security_controls
- risk_assessment
- audit_logs

Backend startup logic in backend/initDb.js applies compatibility updates and ensures baseline roles and constraints are present.

## Development Workflow

Run backend and frontend in separate terminals:

- Terminal 1:
    - cd backend
    - npm install
    - npm run dev

- Terminal 2:
    - cd frontend
    - npm install
    - npm run dev

Then open the frontend URL shown by Vite in your browser.

## Troubleshooting

- Backend cannot connect to DB:
    - Verify backend/.env values and PostgreSQL is running.
- Frontend API errors:
    - Confirm backend is running on port 5000.
- Unauthorized responses (401):
    - Log in again to refresh token/session data.
