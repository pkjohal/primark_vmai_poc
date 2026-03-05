-- ============================================
-- TABLE 1: stores (no dependencies)
-- ============================================
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  store_code TEXT UNIQUE NOT NULL,
  region TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLE 2: users (depends on: stores)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL CHECK (length(pin) = 4 AND pin ~ '^[0-9]+$'),
  store_id UUID REFERENCES stores(id) NOT NULL,
  role TEXT NOT NULL DEFAULT 'store_colleague'
    CHECK (role IN ('store_colleague', 'vm_manager', 'store_manager', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLE 3: compliance_records (depends on: users, stores)
-- Each record = one product compliance check
-- ============================================
CREATE TABLE compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ean TEXT NOT NULL CHECK (length(ean) = 13 AND ean ~ '^[0-9]+$'),
  orin_or_km TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('ORIN', 'KM_CODE')),
  product_description TEXT NOT NULL,
  department TEXT NOT NULL,
  campaign TEXT,
  status TEXT NOT NULL CHECK (status IN ('compliant', 'non_compliant')),
  photo_url TEXT,
  guideline_image_url TEXT,
  user_id UUID REFERENCES users(id) NOT NULL,
  store_id UUID REFERENCES stores(id) NOT NULL,
  checked_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLE 4: vm_tasks (depends on: compliance_records, users, stores)
-- Remediation tasks for VM Managers
-- ============================================
CREATE TABLE vm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_record_id UUID REFERENCES compliance_records(id) NOT NULL,
  store_id UUID REFERENCES stores(id) NOT NULL,
  assigned_to UUID REFERENCES users(id) NOT NULL,
  reported_by UUID REFERENCES users(id) NOT NULL,
  non_compliance_type TEXT NOT NULL
    CHECK (non_compliance_type IN ('missing_pos', 'wrong_position',
      'wrong_fixture', 'damaged_display', 'outdated_promotion', 'other')),
  severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  description TEXT,
  flagged_photo_url TEXT,
  guideline_image_url TEXT,
  evidence_photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'completed', 'closed')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  close_reason TEXT
    CHECK (close_reason IN ('duplicate', 'not_applicable',
      'resolved_externally', 'product_removed'))
);

-- ============================================
-- TABLE 5: audit_log (depends on: users)
-- Immutable log of all events
-- ============================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL
    CHECK (entity_type IN ('compliance', 'task', 'user', 'store')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Functions & Triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION set_task_due_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.due_date = CASE NEW.severity
    WHEN 'critical' THEN now() + interval '4 hours'
    WHEN 'high'     THEN now() + interval '24 hours'
    WHEN 'medium'   THEN now() + interval '72 hours'
    WHEN 'low'      THEN now() + interval '7 days'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vm_tasks_due_date
  BEFORE INSERT ON vm_tasks
  FOR EACH ROW EXECUTE FUNCTION set_task_due_date();

-- ============================================
-- Storage bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('vm-photos', 'vm-photos', true);
