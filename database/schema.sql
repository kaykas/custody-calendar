-- ============================================================================
-- CUSTODY CALENDAR DATABASE SCHEMA
-- Case: Roberts v. Gardenhire (FPT-25-378556)
-- Designed for 100% accuracy with comprehensive audit trail
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: custody_cases
-- Stores case metadata, children information, and parent information
-- ============================================================================
CREATE TABLE custody_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(50) UNIQUE NOT NULL,
    court_name VARCHAR(255) NOT NULL,
    county VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL DEFAULT 'CA',

    -- Case details
    hearing_date DATE,
    presiding_judge VARCHAR(255),
    department VARCHAR(50),
    case_status VARCHAR(50) DEFAULT 'active',

    -- Parent 1 (Mother)
    mother_first_name VARCHAR(100) NOT NULL,
    mother_middle_name VARCHAR(100),
    mother_last_name VARCHAR(100) NOT NULL,
    mother_dob DATE NOT NULL,
    mother_email VARCHAR(255),
    mother_phone VARCHAR(20),

    -- Parent 2 (Father)
    father_first_name VARCHAR(100) NOT NULL,
    father_middle_name VARCHAR(100),
    father_last_name VARCHAR(100) NOT NULL,
    father_dob DATE NOT NULL,
    father_email VARCHAR(255),
    father_phone VARCHAR(20),

    -- Children information (JSONB for flexibility)
    children JSONB NOT NULL,
    -- Example structure:
    -- [
    --   {
    --     "first_name": "Basil",
    --     "middle_name": null,
    --     "last_name": "Roberts-Gardenhire",
    --     "dob": "2017-09-10",
    --     "age": 8
    --   },
    --   {
    --     "first_name": "Alfred",
    --     "middle_name": null,
    --     "last_name": "Roberts-Gardenhire",
    --     "nickname": "Alfie",
    --     "dob": "2020-04-10",
    --     "age": 5
    --   }
    -- ]

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),

    -- Constraints
    CONSTRAINT valid_children CHECK (jsonb_array_length(children) > 0)
);

-- Index for fast lookup
CREATE INDEX idx_custody_cases_case_number ON custody_cases(case_number);
CREATE INDEX idx_custody_cases_status ON custody_cases(case_status);

-- ============================================================================
-- TABLE: custody_rules
-- Stores extracted rules from court orders with JSONB for complex rule data
-- ============================================================================
CREATE TABLE custody_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES custody_cases(id) ON DELETE CASCADE,

    -- Rule identification
    rule_type VARCHAR(50) NOT NULL,
    -- Types: 'regular_schedule', 'summer_schedule', 'holiday', 'special_day',
    --        'travel', 'right_of_first_refusal', 'medical', 'legal_custody'

    rule_name VARCHAR(255) NOT NULL,
    rule_category VARCHAR(50) NOT NULL,
    -- Categories: 'physical_custody', 'legal_custody', 'medical', 'travel', 'other'

    priority INTEGER NOT NULL DEFAULT 100,
    -- Lower number = higher priority (holidays override regular schedule)

    -- Rule details stored as JSONB for flexibility
    rule_data JSONB NOT NULL,
    -- Example structures below

    -- Rule conditions (when does this rule apply?)
    conditions JSONB,
    -- Example: {"year_type": "odd", "month": 10, "day_range": [31, 31]}

    -- Rule actions (what happens when rule is applied?)
    actions JSONB NOT NULL,
    -- Example: {"custodial_parent": "mother", "start_time": "17:00", "end_time": "08:00"}

    -- Extracted from court order
    source_document VARCHAR(255),
    source_page INTEGER,
    source_section VARCHAR(50),
    extracted_text TEXT,

    -- Validation status
    is_validated BOOLEAN DEFAULT FALSE,
    validation_notes TEXT,
    validated_by VARCHAR(255),
    validated_at TIMESTAMP WITH TIME ZONE,

    -- Effective dates
    effective_from DATE NOT NULL,
    effective_until DATE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),

    -- Constraints
    CONSTRAINT valid_priority CHECK (priority >= 0 AND priority <= 1000),
    CONSTRAINT valid_rule_type CHECK (rule_type IN (
        'regular_schedule', 'summer_schedule', 'holiday', 'special_day',
        'travel', 'right_of_first_refusal', 'medical', 'legal_custody',
        'exchange_protocol', 'childcare', 'communication'
    ))
);

-- Indexes for fast rule lookup
CREATE INDEX idx_custody_rules_case_id ON custody_rules(case_id);
CREATE INDEX idx_custody_rules_type ON custody_rules(rule_type);
CREATE INDEX idx_custody_rules_priority ON custody_rules(priority);
CREATE INDEX idx_custody_rules_effective_dates ON custody_rules(effective_from, effective_until);
CREATE INDEX idx_custody_rules_validated ON custody_rules(is_validated);

-- GIN index for JSONB queries
CREATE INDEX idx_custody_rules_rule_data ON custody_rules USING GIN (rule_data);
CREATE INDEX idx_custody_rules_conditions ON custody_rules USING GIN (conditions);

-- ============================================================================
-- TABLE: custody_events
-- Stores generated calendar events based on applied rules
-- ============================================================================
CREATE TABLE custody_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES custody_cases(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES custody_rules(id) ON DELETE SET NULL,

    -- Event details
    event_type VARCHAR(50) NOT NULL,
    -- Types: 'custody_period', 'exchange', 'holiday', 'special_day', 'travel'

    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Date/time information
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,

    -- Custody information
    custodial_parent VARCHAR(10) NOT NULL, -- 'mother' or 'father'
    location TEXT,
    exchange_location TEXT,

    -- Rule application metadata
    applied_rule_data JSONB NOT NULL,
    -- Stores snapshot of rule data at time of event generation

    -- Conflict detection
    has_conflict BOOLEAN DEFAULT FALSE,
    conflict_details JSONB,
    conflict_resolved BOOLEAN DEFAULT FALSE,
    conflict_resolution_notes TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'scheduled',
    -- Status: 'scheduled', 'confirmed', 'modified', 'cancelled', 'completed'

    is_modified BOOLEAN DEFAULT FALSE,
    modification_notes TEXT,
    original_event_id UUID REFERENCES custody_events(id),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),

    -- Constraints
    CONSTRAINT valid_datetime CHECK (end_datetime > start_datetime),
    CONSTRAINT valid_custodial_parent CHECK (custodial_parent IN ('mother', 'father')),
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'custody_period', 'exchange', 'holiday', 'special_day', 'travel', 'other'
    )),
    CONSTRAINT valid_status CHECK (status IN (
        'scheduled', 'confirmed', 'modified', 'cancelled', 'completed'
    ))
);

-- Indexes for event queries
CREATE INDEX idx_custody_events_case_id ON custody_events(case_id);
CREATE INDEX idx_custody_events_rule_id ON custody_events(rule_id);
CREATE INDEX idx_custody_events_dates ON custody_events(start_datetime, end_datetime);
CREATE INDEX idx_custody_events_custodial_parent ON custody_events(custodial_parent);
CREATE INDEX idx_custody_events_status ON custody_events(status);
CREATE INDEX idx_custody_events_conflicts ON custody_events(has_conflict) WHERE has_conflict = TRUE;

-- GIN index for JSONB
CREATE INDEX idx_custody_events_rule_data ON custody_events USING GIN (applied_rule_data);

-- ============================================================================
-- TABLE: validation_checks
-- Audit trail for 100% accuracy validation
-- ============================================================================
CREATE TABLE validation_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES custody_cases(id) ON DELETE CASCADE,

    -- What was validated
    validation_type VARCHAR(50) NOT NULL,
    -- Types: 'rule_extraction', 'rule_consistency', 'event_generation',
    --        'conflict_detection', 'date_calculation'

    validation_target_type VARCHAR(50) NOT NULL,
    -- Types: 'rule', 'event', 'case', 'conflict'

    validation_target_id UUID,
    -- ID of the rule, event, or other entity being validated

    -- Validation details
    validation_method VARCHAR(255) NOT NULL,
    validation_criteria JSONB NOT NULL,
    validation_input JSONB,
    validation_output JSONB,

    -- Results
    passed BOOLEAN NOT NULL,
    confidence_score DECIMAL(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    -- 1.0 = 100% confident, 0.5 = 50% confident

    validation_errors JSONB,
    validation_warnings JSONB,
    validation_notes TEXT,

    -- Reviewer information
    validated_by VARCHAR(255) NOT NULL,
    validation_tool VARCHAR(255),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_validation_type CHECK (validation_type IN (
        'rule_extraction', 'rule_consistency', 'event_generation',
        'conflict_detection', 'date_calculation', 'manual_review'
    ))
);

-- Indexes for validation queries
CREATE INDEX idx_validation_checks_case_id ON validation_checks(case_id);
CREATE INDEX idx_validation_checks_type ON validation_checks(validation_type);
CREATE INDEX idx_validation_checks_target ON validation_checks(validation_target_type, validation_target_id);
CREATE INDEX idx_validation_checks_passed ON validation_checks(passed);
CREATE INDEX idx_validation_checks_confidence ON validation_checks(confidence_score);

-- ============================================================================
-- TABLE: audit_log
-- Comprehensive audit trail for all changes
-- ============================================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- What was changed
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'

    -- Change details
    old_data JSONB,
    new_data JSONB,
    changed_fields JSONB, -- Array of field names that changed

    -- Context
    case_id UUID REFERENCES custody_cases(id) ON DELETE SET NULL,
    change_reason TEXT,
    change_type VARCHAR(50),
    -- Types: 'court_order', 'manual_correction', 'system_generated', 'conflict_resolution'

    -- Who made the change
    changed_by VARCHAR(255) NOT NULL,
    changed_by_role VARCHAR(50),
    ip_address INET,
    user_agent TEXT,

    -- When
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_operation CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Indexes for audit queries
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_case_id ON audit_log(case_id);
CREATE INDEX idx_audit_log_changed_by ON audit_log(changed_by);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_operation ON audit_log(operation);

-- ============================================================================
-- TABLE: rule_conflicts
-- Tracks detected conflicts between rules
-- ============================================================================
CREATE TABLE rule_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES custody_cases(id) ON DELETE CASCADE,

    rule_id_1 UUID NOT NULL REFERENCES custody_rules(id) ON DELETE CASCADE,
    rule_id_2 UUID NOT NULL REFERENCES custody_rules(id) ON DELETE CASCADE,

    conflict_type VARCHAR(50) NOT NULL,
    -- Types: 'overlapping_time', 'contradictory_custody', 'priority_unclear'

    conflict_description TEXT NOT NULL,
    conflict_severity VARCHAR(20) NOT NULL,
    -- Severity: 'critical', 'high', 'medium', 'low'

    conflict_data JSONB NOT NULL,

    -- Resolution
    is_resolved BOOLEAN DEFAULT FALSE,
    resolution_method VARCHAR(255),
    resolution_notes TEXT,
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),

    -- Constraints
    CONSTRAINT valid_conflict_severity CHECK (conflict_severity IN ('critical', 'high', 'medium', 'low')),
    CONSTRAINT different_rules CHECK (rule_id_1 != rule_id_2)
);

-- Indexes for conflict queries
CREATE INDEX idx_rule_conflicts_case_id ON rule_conflicts(case_id);
CREATE INDEX idx_rule_conflicts_rules ON rule_conflicts(rule_id_1, rule_id_2);
CREATE INDEX idx_rule_conflicts_resolved ON rule_conflicts(is_resolved);
CREATE INDEX idx_rule_conflicts_severity ON rule_conflicts(conflict_severity);

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_custody_cases_updated_at BEFORE UPDATE ON custody_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custody_rules_updated_at BEFORE UPDATE ON custody_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custody_events_updated_at BEFORE UPDATE ON custody_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit log trigger function
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_log (table_name, record_id, operation, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), current_user);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_log (table_name, record_id, operation, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), current_user);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_log (table_name, record_id, operation, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), current_user);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
CREATE TRIGGER audit_custody_cases AFTER INSERT OR UPDATE OR DELETE ON custody_cases
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_custody_rules AFTER INSERT OR UPDATE OR DELETE ON custody_rules
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_custody_events AFTER INSERT OR UPDATE OR DELETE ON custody_events
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Active validated rules
CREATE VIEW active_validated_rules AS
SELECT
    cr.*,
    cc.case_number,
    cc.mother_first_name || ' ' || cc.mother_last_name AS mother_name,
    cc.father_first_name || ' ' || cc.father_last_name AS father_name
FROM custody_rules cr
JOIN custody_cases cc ON cr.case_id = cc.id
WHERE cr.is_validated = TRUE
  AND cc.case_status = 'active'
  AND (cr.effective_until IS NULL OR cr.effective_until >= CURRENT_DATE)
ORDER BY cr.priority ASC;

-- View: Upcoming events
CREATE VIEW upcoming_events AS
SELECT
    ce.*,
    cc.case_number,
    cr.rule_name,
    cr.rule_type
FROM custody_events ce
JOIN custody_cases cc ON ce.case_id = cc.id
LEFT JOIN custody_rules cr ON ce.rule_id = cr.id
WHERE ce.start_datetime >= CURRENT_TIMESTAMP
  AND ce.status IN ('scheduled', 'confirmed')
  AND cc.case_status = 'active'
ORDER BY ce.start_datetime ASC;

-- View: Unresolved conflicts
CREATE VIEW unresolved_conflicts AS
SELECT
    rc.*,
    cc.case_number,
    r1.rule_name AS rule_1_name,
    r2.rule_name AS rule_2_name
FROM rule_conflicts rc
JOIN custody_cases cc ON rc.case_id = cc.id
JOIN custody_rules r1 ON rc.rule_id_1 = r1.id
JOIN custody_rules r2 ON rc.rule_id_2 = r2.id
WHERE rc.is_resolved = FALSE
  AND cc.case_status = 'active'
ORDER BY
    CASE rc.conflict_severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    rc.detected_at DESC;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE custody_cases IS 'Stores case metadata, children information, and parent information';
COMMENT ON TABLE custody_rules IS 'Stores extracted rules from court orders with JSONB for complex rule data';
COMMENT ON TABLE custody_events IS 'Stores generated calendar events based on applied rules';
COMMENT ON TABLE validation_checks IS 'Audit trail for 100% accuracy validation';
COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for all changes';
COMMENT ON TABLE rule_conflicts IS 'Tracks detected conflicts between rules';

COMMENT ON COLUMN custody_rules.priority IS 'Lower number = higher priority. Holidays (1-99) override regular schedule (100+)';
COMMENT ON COLUMN validation_checks.confidence_score IS 'Range: 0.0 to 1.0. Target minimum: 0.99 for production use';
