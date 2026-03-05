-- Privacy Risk Analyzer Database Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Analyst', 'Intern')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assets Table
CREATE TABLE IF NOT EXISTS assets (
    asset_id SERIAL PRIMARY KEY,
    asset_name VARCHAR(255) NOT NULL,
    description TEXT,
    asset_type VARCHAR(100),
    risk_level VARCHAR(50) CHECK (risk_level IN ('high', 'medium', 'low')),
    owner_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PII Types Table
CREATE TABLE IF NOT EXISTS pii (
    pii_id SERIAL PRIMARY KEY,
    pii_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    sensitivity_level VARCHAR(50) CHECK (sensitivity_level IN ('high', 'medium', 'low')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset-PII Junction Table (Many-to-Many Relationship)
CREATE TABLE IF NOT EXISTS asset_pii (
    asset_pii_id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    pii_id INTEGER NOT NULL REFERENCES pii(pii_id) ON DELETE CASCADE,
    discovery_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asset_id, pii_id)
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    permission_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    asset_id INTEGER NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    permission_type VARCHAR(50) CHECK (permission_type IN ('read', 'write', 'delete', 'admin')),
    granted_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, asset_id)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INTEGER,
    changes JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security Controls Table
CREATE TABLE IF NOT EXISTS security_controls (
    control_id SERIAL PRIMARY KEY,
    control_name VARCHAR(255) NOT NULL,
    description TEXT,
    asset_id INTEGER REFERENCES assets(asset_id) ON DELETE CASCADE,
    control_status VARCHAR(50) CHECK (control_status IN ('active', 'inactive', 'pending')),
    created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Better Query Performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_assets_risk_level ON assets(risk_level);
CREATE INDEX IF NOT EXISTS idx_assets_owner_id ON assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_asset_pii_asset_id ON asset_pii(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_pii_pii_id ON asset_pii(pii_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_asset_id ON permissions(asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_controls_asset_id ON security_controls(asset_id);

-- Insert Default Admin User
INSERT INTO users (username, email, password, role) 
VALUES ('admin', 'admin@privacyrisk.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/Kym', 'Admin')
ON CONFLICT (username) DO NOTHING;

-- Insert Sample Data
INSERT INTO pii (pii_name, description, sensitivity_level) 
VALUES 
    ('Social Security Number', 'SSN used for identification', 'high'),
    ('Credit Card Numbers', 'Payment card information', 'high'),
    ('Email Address', 'Personal email', 'medium'),
    ('Phone Number', 'Contact information', 'medium'),
    ('Date of Birth', 'Personal date information', 'low')
ON CONFLICT (pii_name) DO NOTHING;

INSERT INTO assets (asset_name, description, asset_type, risk_level) 
VALUES 
    ('Customer Database', 'Main customer data storage', 'database', 'high'),
    ('Employee Records', 'HR employee information', 'database', 'medium'),
    ('Public Website', 'Company public web service', 'application', 'low'),
    ('Financial Systems', 'Payment processing system', 'application', 'high'),
    ('Backup Storage', 'Automated backup facility', 'storage', 'medium')
ON CONFLICT DO NOTHING;
