-- 1. ROLE TABLE
CREATE TABLE role (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);


-- 2. USER TABLE
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id)
        REFERENCES role(role_id)
        ON DELETE SET NULL
);


-- 3. DATA ASSET TABLE
CREATE TABLE data_asset (
    asset_id SERIAL PRIMARY KEY,
    asset_name VARCHAR(100) NOT NULL,
    db_name VARCHAR(100),
    table_name VARCHAR(100),
    sensitivity_level VARCHAR(50),
    contains_pii BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_asset_user
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- 4. PII TYPE TABLE
CREATE TABLE pii_type (
    pii_id SERIAL PRIMARY KEY,
    pii_name VARCHAR(100) NOT NULL,
    pii_category VARCHAR(100),
    pii_weight INT NOT NULL
);


-- 5. ASSET – PII MAPPING TABLE
CREATE TABLE asset_pii_mapping (
    mapping_id SERIAL PRIMARY KEY,
    asset_id INT NOT NULL,
    pii_id INT NOT NULL,
    column_name VARCHAR(100),
    
    CONSTRAINT fk_mapping_asset
        FOREIGN KEY (asset_id)
        REFERENCES data_asset(asset_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_mapping_pii
        FOREIGN KEY (pii_id)
        REFERENCES pii_type(pii_id)
        ON DELETE CASCADE
);


-- 6. ACCESS PERMISSION TABLE
CREATE TABLE access_permission (
    permission_id SERIAL PRIMARY KEY,
    asset_id INT NOT NULL,
    role_id INT NOT NULL,
    access_type VARCHAR(20) CHECK (access_type IN ('READ','WRITE','UPDATE')),
    
    CONSTRAINT fk_permission_asset
        FOREIGN KEY (asset_id)
        REFERENCES data_asset(asset_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_permission_role
        FOREIGN KEY (role_id)
        REFERENCES role(role_id)
        ON DELETE CASCADE
);


-- 7. SECURITY CONTROL TABLE
CREATE TABLE security_control (
    control_id SERIAL PRIMARY KEY,
    asset_id INT UNIQUE,
    encryption BOOLEAN DEFAULT FALSE,
    masking BOOLEAN DEFAULT FALSE,
    hashing BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT fk_control_asset
        FOREIGN KEY (asset_id)
        REFERENCES data_asset(asset_id)
        ON DELETE CASCADE
);


-- 8. AUDIT LOG TABLE
CREATE TABLE audit_log (
    log_id SERIAL PRIMARY KEY,
    user_id INT,
    asset_id INT,
    action VARCHAR(20) CHECK (action IN ('READ','WRITE','UPDATE','DELETE')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_log_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,
        
    CONSTRAINT fk_log_asset
        FOREIGN KEY (asset_id)
        REFERENCES data_asset(asset_id)
        ON DELETE SET NULL
);


-- 9. RISK ASSESSMENT TABLE
CREATE TABLE risk_assessment (
    risk_id SERIAL PRIMARY KEY,
    asset_id INT UNIQUE,
    risk_score NUMERIC(5,2),
    risk_level VARCHAR(20) CHECK (risk_level IN ('LOW','MEDIUM','HIGH')),
    last_analyzed TIMESTAMP,
    
    CONSTRAINT fk_risk_asset
        FOREIGN KEY (asset_id)
        REFERENCES data_asset(asset_id)
        ON DELETE CASCADE
);