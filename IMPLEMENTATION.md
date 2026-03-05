# VM.ai POC — Full Implementation Guide

## Project Overview

Build a mobile-first internal operations tool called **VM.ai** for Primark store teams. It enables store colleagues to scan product barcodes, verify Visual Merchandising (VM) displays against campaign guidelines, flag non-compliance, and track remediation tasks. Not customer-facing — optimised for one-handed mobile use on the shop floor.

**Stack:** React + TypeScript + Tailwind CSS + Supabase (Postgres + Realtime + Storage) + html5-qrcode + Recharts + date-fns + lucide-react + browser-image-compression + Vite

---

## Phase 0: Project Scaffolding

```bash
npm create vite@latest vmai -- --template react-ts
cd vmai
npm install @supabase/supabase-js react-router-dom html5-qrcode recharts date-fns lucide-react browser-image-compression
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Create `.env.example`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create `.env` from `.env.example` and fill in real values.

### File Structure

```
/public
  /images                    -- VM reference images (from PDFs)
    spring26-01.jpg ... spring26-18.jpg
    trend_ends-1.jpg ... trend_ends-6.jpg
  vm_product_data.json       -- Product lookup data (98 products)
/src
  /components
    /ui        -> StatCard, PinPad, ConfirmDialog, EmptyState,
                  Toast, DateRangePicker, DataTable, ZoomSlider,
                  ComplianceBadge, SeverityBadge, PhotoCapture
    /layout    -> NavBar, BottomNav, PageHeader
    /scanning  -> BarcodeScanner, VMGuidelineCard
    /tasks     -> TaskCard, ComparisonView
  /screens
    LoginScreen.tsx
    ScanScreen.tsx
    ProductScreen.tsx         -- VM Guideline Display
    FlagScreen.tsx            -- Non-Compliance Form
    TasksScreen.tsx
    TaskDetailScreen.tsx
    DashboardScreen.tsx
    AdminScreen.tsx
  /hooks
    useAuth.ts
    useVMData.ts             -> Load JSON, build EAN lookup map
    useCamera.ts             -> Camera access, zoom, lifecycle
    useBarcodeScanner.ts     -> EAN-13 detection + validation
    useCompliance.ts         -> Compliance record CRUD
    useTasks.ts              -> VM task CRUD + realtime
    useDashboardData.ts      -> Dashboard queries + aggregation
    usePhotoUpload.ts        -> Compress + upload to Supabase Storage
    useStores.ts
    useUsers.ts
    useAudit.ts
    useToast.ts
  /lib
    supabase.ts             -> Supabase client init
    types.ts                -> All TypeScript types and constants
    ean13.ts                -> EAN-13 validation utility
    imageUtils.ts           -> Photo compression utility
    utils.ts                -> formatDate, formatRelativeTime, etc.
  /context
    AuthContext.tsx
    ToastContext.tsx
    VMDataContext.tsx        -> VM product data provider
  App.tsx
  main.tsx
  index.css                 -> Tailwind imports + custom CSS
/supabase
  schema.sql               -> Tables + functions + triggers
  seed.sql                  -> Stores, users, sample records
  indexes.sql
tailwind.config.js         -> Custom Primark theme
postcss.config.js
vite.config.ts
package.json
tsconfig.json
README.md
.env.example
```

---

## Phase 1: Tailwind Config & Design System

### `tailwind.config.js` (copy exactly)

```js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primark: {
          blue: '#0DAADB',
          'blue-dark': '#0987A8',
          'blue-light': '#E6F7FB',
        },
        navy: '#1A1F36',
        charcoal: '#374151',
        'mid-grey': '#6B7280',
        'light-grey': '#F3F4F6',
        'border-grey': '#E5E7EB',
        success: { DEFAULT: '#10B981', bg: '#ECFDF5' },
        warning: { DEFAULT: '#F59E0B', bg: '#FFFBEB' },
        danger: { DEFAULT: '#EF4444', bg: '#FEF2F2' },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### Design Tokens

**Typography:**
- Page title: `text-2xl font-bold` (24px, 700)
- Section heading: `text-lg font-semibold` (18px, 600)
- Card title: `text-base font-semibold` (16px, 600)
- Body: `text-[15px] font-normal`
- Caption/label: `text-[13px] font-medium uppercase tracking-wide`
- Large stat number: `text-4xl font-bold` (36–48px, 700)
- Table text: `text-sm font-normal` (14px, 400)

**Spacing:**
- Page padding: `px-4 py-4` mobile, `px-6 py-6` tablet+
- Card padding: `p-4` (16px)
- Card border-radius: `rounded-xl` (12px)
- Card shadow: `shadow-sm`
- Gap between cards: `gap-3` (12px)
- Button min-height: `min-h-[48px]` (touch targets)
- Input min-height: `min-h-[44px]`
- Button border-radius: `rounded-lg` (8px)
- Bottom nav height: `h-16` (64px)
- Top navbar height: `h-14` (56px)

**NavBar (Top):**
- Height: 56px, `bg-navy`
- Left: "PRIMARK" text (`uppercase tracking-[0.2em] font-bold text-primark-blue text-[28px]`), subtitle "VM.ai" in `text-mid-grey text-sm`
- Right: user name, store name, logout icon (`LogOut` from lucide-react)

**Bottom Navigation:**
- Fixed at viewport bottom, `bg-white border-t border-border-grey h-16`
- Active tab: icon + label in `text-primark-blue`
- Inactive tab: `text-mid-grey`
- Role-scoped: see Section 7

**Primary Action Buttons:**
```
bg-primark-blue text-white font-semibold rounded-lg min-h-[48px] px-6
hover:bg-primark-blue-dark active:scale-[0.98] transition-all
```

**Secondary Action Buttons:**
```
bg-white border border-border-grey text-charcoal font-semibold rounded-lg min-h-[48px] px-6
hover:bg-light-grey
```

**Danger / Flag Buttons:**
```
bg-danger text-white font-semibold rounded-lg min-h-[48px] px-6
hover:bg-red-600
```

**Compliance Status Badges:**
- compliant: `bg-success-bg text-success font-medium rounded-full px-3 py-1 text-xs`
- non_compliant: `bg-danger-bg text-danger font-medium rounded-full px-3 py-1 text-xs`

**Severity Badges:**
- critical: `bg-danger text-white font-bold rounded-full px-3 py-1 text-xs`
- high: `bg-warning text-white rounded-full px-3 py-1 text-xs`
- medium: `bg-primark-blue text-white rounded-full px-3 py-1 text-xs`
- low: `bg-border-grey text-charcoal rounded-full px-3 py-1 text-xs`

---

## Phase 2: Database Setup

Run these SQL files in the Supabase SQL editor **in this exact order**: schema.sql → indexes.sql → seed.sql

### `supabase/schema.sql`

```sql
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
-- Postgres Functions & Triggers
-- ============================================

-- updated_at trigger
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

-- Auto due date on task creation based on severity
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

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vm-photos', 'vm-photos', true);
```

### `supabase/indexes.sql`

```sql
CREATE INDEX idx_compliance_store ON compliance_records(store_id, status);
CREATE INDEX idx_compliance_user ON compliance_records(user_id);
CREATE INDEX idx_compliance_checked ON compliance_records(checked_at);
CREATE INDEX idx_compliance_ean ON compliance_records(ean);
CREATE INDEX idx_tasks_store ON vm_tasks(store_id, status);
CREATE INDEX idx_tasks_assigned ON vm_tasks(assigned_to, status);
CREATE INDEX idx_tasks_severity ON vm_tasks(severity, status);
CREATE INDEX idx_tasks_due ON vm_tasks(due_date);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_users_store ON users(store_id, is_active);
```

### `supabase/seed.sql`

```sql
-- ===== Stores =====
INSERT INTO stores (id, name, store_code, region) VALUES
('a0000001-0000-0000-0000-000000000001', 'Manchester Arndale', 'MAN01', 'North West'),
('a0000001-0000-0000-0000-000000000002', 'Birmingham Primark', 'BHM01', 'West Midlands'),
('a0000001-0000-0000-0000-000000000003', 'London Oxford Street', 'LON01', 'London'),
('a0000001-0000-0000-0000-000000000004', 'Leeds White Rose', 'LDS01', 'Yorkshire'),
('a0000001-0000-0000-0000-000000000005', 'Dubai City Centre', 'DXB01', 'UAE');

-- ===== Users =====
INSERT INTO users (id, name, email, pin, store_id, role) VALUES
-- Manchester
('d0000001-0000-0000-0000-000000000001', 'Sarah K', 'sarah.k@primark.com', '1234',
  'a0000001-0000-0000-0000-000000000001', 'store_colleague'),
('d0000001-0000-0000-0000-000000000002', 'Tom B', 'tom.b@primark.com', '5678',
  'a0000001-0000-0000-0000-000000000001', 'vm_manager'),
('d0000001-0000-0000-0000-000000000005', 'Claire M', 'claire.m@primark.com', '4567',
  'a0000001-0000-0000-0000-000000000001', 'store_manager'),
-- Birmingham
('d0000001-0000-0000-0000-000000000003', 'Amy L', 'amy.l@primark.com', '1234',
  'a0000001-0000-0000-0000-000000000002', 'store_colleague'),
('d0000001-0000-0000-0000-000000000004', 'James R', 'james.r@primark.com', '5678',
  'a0000001-0000-0000-0000-000000000002', 'vm_manager'),
-- London
('d0000001-0000-0000-0000-000000000006', 'Dan W', 'dan.w@primark.com', '9012',
  'a0000001-0000-0000-0000-000000000003', 'admin'),
('d0000001-0000-0000-0000-000000000007', 'Priya S', 'priya.s@primark.com', '3456',
  'a0000001-0000-0000-0000-000000000003', 'vm_manager'),
-- Leeds
('d0000001-0000-0000-0000-000000000008', 'Ben T', 'ben.t@primark.com', '1234',
  'a0000001-0000-0000-0000-000000000004', 'store_colleague'),
('d0000001-0000-0000-0000-000000000009', 'Laura H', 'laura.h@primark.com', '5678',
  'a0000001-0000-0000-0000-000000000004', 'vm_manager'),
-- Dubai
('d0000001-0000-0000-0000-000000000010', 'Fatima A', 'fatima.a@primark.com', '1234',
  'a0000001-0000-0000-0000-000000000005', 'store_colleague'),
('d0000001-0000-0000-0000-000000000011', 'Omar K', 'omar.k@primark.com', '5678',
  'a0000001-0000-0000-0000-000000000005', 'vm_manager'),
('d0000001-0000-0000-0000-000000000012', 'Nadia R', 'nadia.r@primark.com', '4567',
  'a0000001-0000-0000-0000-000000000005', 'store_manager');

-- ===== Seed Compliance Records =====
INSERT INTO compliance_records (id, ean, orin_or_km, identifier_type,
  product_description, department, campaign, status,
  guideline_image_url, user_id, store_id, checked_at) VALUES
-- Dubai - compliant
('c0000001-0000-0000-0000-000000000001', '5099301000012', '89977', 'ORIN',
  'Cross Body Bag', 'D1', 'UAE Spring 2026 A4 Solid', 'compliant',
  '/images/spring26-01.jpg',
  'd0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000005',
  now() - interval '3 days'),
('c0000001-0000-0000-0000-000000000002', '5099301000050', '11481', 'ORIN',
  'Baseball Cap', 'D1', 'UAE Spring 2026 A4 Solid', 'compliant',
  '/images/spring26-01.jpg',
  'd0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000005',
  now() - interval '3 days' + interval '15 minutes'),
('c0000001-0000-0000-0000-000000000003', '5099301000326', '92476', 'ORIN',
  'T-Shirt Bra', 'D4', 'UAE Spring 2026 A4 Solid', 'compliant',
  '/images/spring26-07.jpg',
  'd0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000005',
  now() - interval '2 days'),
('c0000001-0000-0000-0000-000000000004', '5099301001002', '91370', 'KM_CODE',
  'Satin Finish Foundation', 'D23', 'UAE D23 NAV Trend Ends NSE 2026', 'compliant',
  '/images/trend_ends-3.jpg',
  'd0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000005',
  now() - interval '2 days' + interval '30 minutes'),
-- Dubai - non-compliant
('c0000001-0000-0000-0000-000000000005', '5099301000555', '98842', 'ORIN',
  'Flip Flops', 'D7', 'UAE Spring 2026 A4 Solid', 'non_compliant',
  '/images/spring26-11.jpg',
  'd0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000005',
  now() - interval '2 days' + interval '1 hour'),
('c0000001-0000-0000-0000-000000000006', '5099301001057', '23148', 'KM_CODE',
  'Mens Fragrance 50ml', 'D23', 'UAE D23 NAV Trend Ends NSE 2026', 'non_compliant',
  '/images/trend_ends-4.jpg',
  'd0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000005',
  now() - interval '1 day'),
('c0000001-0000-0000-0000-000000000007', '5099301000364', '39080', 'ORIN',
  '3pk Seamfree Bra', 'D4', 'UAE Spring 2026 A4 Solid', 'non_compliant',
  '/images/spring26-08.jpg',
  'd0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000005',
  now() - interval '1 day' + interval '2 hours'),
-- Manchester
('c0000001-0000-0000-0000-000000000008', '5099301000760', '32586', 'ORIN',
  '3pk Woven Briefs', 'D16', 'UAE Spring 2026 A4 Solid', 'compliant',
  '/images/spring26-16.jpg',
  'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001',
  now() - interval '2 days'),
('c0000001-0000-0000-0000-000000000009', '5099301000296', '84625', 'ORIN',
  '5pk Quarter Crew Socks', 'D2', 'UAE Spring 2026 A4 Solid', 'compliant',
  '/images/spring26-06.jpg',
  'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001',
  now() - interval '1 day'),
('c0000001-0000-0000-0000-000000000010', '5099301000708', '45065', 'ORIN',
  '3pk Hipster Briefs', 'D16', 'UAE Spring 2026 A4 Solid', 'non_compliant',
  '/images/spring26-14.jpg',
  'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001',
  now() - interval '1 day' + interval '30 minutes'),
('c0000001-0000-0000-0000-000000000011', '5099301000876', '96775', 'ORIN',
  '7pk Trainer Liners', 'D16', 'UAE Spring 2026 A4 Solid', 'compliant',
  '/images/spring26-18.jpg',
  'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001',
  now() - interval '12 hours'),
('c0000001-0000-0000-0000-000000000012', '5099301000043', '64503', 'ORIN',
  'Belt', 'D1', 'UAE Spring 2026 A4 Solid', 'non_compliant',
  '/images/spring26-01.jpg',
  'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001',
  now() - interval '6 hours');

-- ===== Seed VM Tasks =====
INSERT INTO vm_tasks (id, compliance_record_id, store_id, assigned_to, reported_by,
  non_compliance_type, severity, description, guideline_image_url,
  status, created_at) VALUES
-- Dubai tasks
('t0000001-0000-0000-0000-000000000001',
  'c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005',
  'd0000001-0000-0000-0000-000000000011', 'd0000001-0000-0000-0000-000000000010',
  'wrong_position', 'high', 'Flip flops displayed on wrong fixture - should be on slat wall not shelf',
  '/images/spring26-11.jpg', 'open',
  now() - interval '2 days' + interval '1 hour'),
('t0000001-0000-0000-0000-000000000002',
  'c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000005',
  'd0000001-0000-0000-0000-000000000011', 'd0000001-0000-0000-0000-000000000010',
  'missing_pos', 'critical', 'Fragrance POS signage completely missing from trend end display',
  '/images/trend_ends-4.jpg', 'in_progress',
  now() - interval '1 day'),
('t0000001-0000-0000-0000-000000000003',
  'c0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000005',
  'd0000001-0000-0000-0000-000000000011', 'd0000001-0000-0000-0000-000000000010',
  'outdated_promotion', 'medium', 'Old campaign pricing still displayed on bra fixture',
  '/images/spring26-08.jpg', 'open',
  now() - interval '1 day' + interval '2 hours'),
-- Manchester tasks
('t0000001-0000-0000-0000-000000000004',
  'c0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000001',
  'd0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001',
  'damaged_display', 'low', 'Minor tear on shelf edge label for hipster briefs',
  '/images/spring26-14.jpg', 'completed',
  now() - interval '1 day' + interval '30 minutes'),
('t0000001-0000-0000-0000-000000000005',
  'c0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000001',
  'd0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001',
  'wrong_fixture', 'medium', 'Belt displayed in bags section instead of accessories',
  '/images/spring26-01.jpg', 'open',
  now() - interval '6 hours');

-- ===== Seed Audit Log =====
INSERT INTO audit_log (entity_type, entity_id, action, user_id, created_at) VALUES
('compliance', 'c0000001-0000-0000-0000-000000000001', 'confirmed',
  'd0000001-0000-0000-0000-000000000010', now() - interval '3 days'),
('compliance', 'c0000001-0000-0000-0000-000000000005', 'flagged',
  'd0000001-0000-0000-0000-000000000010', now() - interval '2 days' + interval '1 hour'),
('task', 't0000001-0000-0000-0000-000000000001', 'created',
  'd0000001-0000-0000-0000-000000000010', now() - interval '2 days' + interval '1 hour'),
('task', 't0000001-0000-0000-0000-000000000002', 'status_change',
  'd0000001-0000-0000-0000-000000000011', now() - interval '20 hours'),
('task', 't0000001-0000-0000-0000-000000000004', 'completed',
  'd0000001-0000-0000-0000-000000000002', now() - interval '18 hours');
```

---

## Phase 3: Core Library Files

### `src/lib/types.ts`

```typescript
export type UserRole = 'store_colleague' | 'vm_manager' | 'store_manager' | 'admin';
export type ComplianceStatus = 'compliant' | 'non_compliant';
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'closed';
export type NonComplianceType = 'missing_pos' | 'wrong_position' |
  'wrong_fixture' | 'damaged_display' | 'outdated_promotion' | 'other';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type IdentifierType = 'ORIN' | 'KM_CODE';
export type CloseReason = 'duplicate' | 'not_applicable' |
  'resolved_externally' | 'product_removed';

export interface Store {
  id: string; name: string; store_code: string;
  region: string | null; is_active: boolean; created_at: string;
}

export interface User {
  id: string; name: string; email: string; pin: string;
  store_id: string; role: UserRole; is_active: boolean;
  created_at: string; updated_at: string;
}

export interface VMProduct {
  ean13: string;
  identifier_type: IdentifierType;
  identifier: string;
  description: string;
  department: string;
  subdepartment: string;
  age_range: string | null;
  price_aed: number;
  price_gbp: number;
  campaign: string;
  vm_image: string;       // relative path e.g. "images/spring26-01.jpg"
  source_page: number;
  source_ref: string;
  expiry_date?: string;
  pos_format?: string;
}

export interface ComplianceRecord {
  id: string; ean: string; orin_or_km: string;
  identifier_type: IdentifierType; product_description: string;
  department: string; campaign: string | null;
  status: ComplianceStatus; photo_url: string | null;
  guideline_image_url: string | null; user_id: string;
  store_id: string; checked_at: string;
  user?: User; store?: Store;
}

export interface VMTask {
  id: string; compliance_record_id: string; store_id: string;
  assigned_to: string; reported_by: string;
  non_compliance_type: NonComplianceType; severity: Severity;
  description: string | null; flagged_photo_url: string | null;
  guideline_image_url: string | null; evidence_photo_url: string | null;
  status: TaskStatus; due_date: string | null; created_at: string;
  completed_at: string | null; close_reason: CloseReason | null;
  compliance_record?: ComplianceRecord; assigned_user?: User; reporter?: User;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  store_colleague: 'Store Colleague', vm_manager: 'VM Manager',
  store_manager: 'Store Manager', admin: 'Administrator',
};

export const NON_COMPLIANCE_LABELS: Record<NonComplianceType, string> = {
  missing_pos: 'Missing POS Material', wrong_position: 'Wrong Position',
  wrong_fixture: 'Wrong Fixture', damaged_display: 'Damaged Display',
  outdated_promotion: 'Outdated Promotion', other: 'Other',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low',
};

export const CLOSE_REASON_LABELS: Record<CloseReason, string> = {
  duplicate: 'Duplicate', not_applicable: 'Not Applicable',
  resolved_externally: 'Resolved Externally',
  product_removed: 'Product Removed from Display',
};
```

### `src/lib/ean13.ts`

```typescript
/**
 * Validates an EAN-13 barcode string.
 * Returns true if the string is exactly 13 digits and the check digit is correct.
 */
export function validateEAN13(ean: string): boolean {
  if (!/^\d{13}$/.test(ean)) return false;
  const digits = ean.split('').map(Number);
  const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[12];
}
```

### `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const VM_PHOTOS_BUCKET = 'vm-photos';
```

### `src/lib/imageUtils.ts`

```typescript
import imageCompression from 'browser-image-compression';

export async function compressPhoto(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });
}
```

### `src/lib/utils.ts`

```typescript
import { format, formatDistanceToNow, isAfter } from 'date-fns';

export const formatDate = (d: string) => format(new Date(d), 'dd MMM yyyy, HH:mm');
export const formatRelativeTime = (d: string) => formatDistanceToNow(new Date(d), { addSuffix: true });
export const isOverdue = (dueDate: string | null) =>
  dueDate ? isAfter(new Date(), new Date(dueDate)) : false;

/** Resolve vm_image relative path to absolute URL for use in <img src> */
export const resolveImagePath = (vmImage: string) => `/${vmImage}`;
```

---

## Phase 4: Context & Auth

### `src/context/ToastContext.tsx`

Provide a `useToast()` hook with `showToast(message, variant: 'success'|'error'|'warning')`. Render a fixed toast at `bottom-20` (above bottom nav) that auto-dismisses after 5 seconds. Use Tailwind for colour-coding: success = `bg-success`, error = `bg-danger`, warning = `bg-warning`.

### `src/context/AuthContext.tsx`

```typescript
interface AuthContextValue {
  store: Store | null;
  user: User | null;
  isStoreColleague: boolean;
  isVMManager: boolean;
  isStoreManager: boolean;
  isAdmin: boolean;
  canViewTasks: boolean;       // vm_manager, store_manager, admin
  canManageTasks: boolean;     // vm_manager, store_manager, admin
  canViewDashboard: boolean;   // store_manager, admin
  canManageUsers: boolean;     // admin only
  canManageStores: boolean;    // admin only
  canViewAllStores: boolean;   // admin only
  login: (storeId: string, userId: string, pin: string) => Promise<boolean>;
  logout: () => void;
}
```

- PIN auth: query `users` table directly, compare PIN in-app. No Supabase Auth.
- Session lives in React state only (no localStorage). Page refresh redirects to `/login`.
- `login()` returns `true` on success, `false` on wrong PIN.

### `src/context/VMDataContext.tsx`

- Loads `/vm_product_data.json` on app mount via `fetch('/vm_product_data.json')`.
- Builds a `Map<string, VMProduct>` keyed by `ean13`.
- Exposes `getProductByEAN(ean: string): VMProduct | undefined`.
- Loading state with skeleton. Error state with toast.

---

## Phase 5: Hooks

### `useToast.ts`
Reads from `ToastContext`. Exposes `showToast(msg, variant)`.

### `useAuth.ts`
Reads from `AuthContext`. Exposes all auth values + `login` / `logout`.

### `useVMData.ts`
Reads from `VMDataContext`. Exposes `getProductByEAN`, `isLoading`, `products`.

### `useCamera.ts`
Manages `MediaDevices.getUserMedia` lifecycle. Returns:
- `stream`: `MediaStream | null`
- `error`: permission denied or not available
- `supportedZoom`: `{ min, max }` from `MediaTrackCapabilities`
- `setZoom(value: number)`: applies via `MediaTrackConstraints.advanced[{ zoom }]`
- `toggleTorch()`: flash/torch toggle

### `useBarcodeScanner.ts`
Wraps `html5-qrcode`. Configuration:
- Format: EAN-13 only (`Html5QrcodeSupportedFormats.EAN_13`)
- `facingMode: 'environment'`
- On decode: validate with `validateEAN13()`, then look up in VM data map
- Scan lock: set `isScanning = false` after successful decode; re-enable on return to scan screen
- Debounce: 1.5s cooldown after each successful scan
- Beep on success: `AudioContext` with a short 880Hz tone
- Haptic: `navigator.vibrate(200)` where supported

### `useCompliance.ts`
- `createRecord(data)`: INSERT into `compliance_records`, then `insertAuditLog()`
- `getRecentChecks(storeId, limit)`: SELECT last N records for current store
- `getRecord(id)`: fetch single record with joined user

### `useTasks.ts`
- `getTasks(storeId, status?)`: SELECT from `vm_tasks` with joins
- `updateStatus(id, status, evidencePhotoUrl?)`: UPDATE status
- `closeTask(id, reason)`: UPDATE status = 'closed', close_reason
- Realtime: subscribe to `postgres_changes` on `vm_tasks` for INSERT + UPDATE, filtered by `store_id`
- Auto-assign: when creating a task, find the vm_manager for the store from `users` table

### `useDashboardData.ts`
- `getStats(storeId?, from?, to?)`: counts and rate from `compliance_records`
- `getChecksPerDay(storeId?, from?, to?)`: group by day
- `getChecksByDepartment(storeId?, from?, to?)`: group by department
- `getRecentChecks(storeId?, limit)`: with user + store joins
- Realtime: subscribe to INSERT on `compliance_records`
- `canViewAllStores` guard: admin sees all stores, store_manager sees own store only

### `usePhotoUpload.ts`
- `uploadPhoto(file, path)`: compress with `compressPhoto()`, then upload to `vm-photos` bucket
- Returns `publicUrl` via `supabase.storage.from('vm-photos').getPublicUrl(path)`
- Path convention: `compliance/{record_id}.jpg` | `tasks/{task_id}_evidence.jpg`

### `useAudit.ts`
- `log(entityType, entityId, action, metadata?)`: INSERT into `audit_log`

### `useStores.ts` / `useUsers.ts`
- Standard CRUD hooks for admin screen
- `useStores`: fetch active stores ordered alphabetically
- `useUsers`: fetch users filtered by store, ordered alphabetically

---

## Phase 6: Reusable UI Components

### `src/components/ui/`

**`ComplianceBadge.tsx`** — `status: ComplianceStatus` prop. Pill badge, green/red.

**`SeverityBadge.tsx`** — `severity: Severity` prop. Colour-coded pill per design tokens.

**`PinPad.tsx`** — 4-digit numpad grid. Buttons `min-w-[64px] min-h-[64px]`. Props: `onComplete(pin: string)`, `onClear()`. Shows 4 dots filling left-to-right. Shake animation (`animate-shake`) on error via prop `hasError`.

**`StatCard.tsx`** — `value`, `label`, `colour` (`primark-blue` | `success` | `warning`), optional `trend`. Large number `text-4xl font-bold`, label below in `text-[13px] uppercase tracking-wide text-mid-grey`.

**`EmptyState.tsx`** — `icon: LucideIcon`, `message: string`, optional `cta`. Centred, icon `text-border-grey`, message `text-mid-grey`.

**`Toast.tsx`** — Fixed bottom notification. Auto-dismisses 5s. Colour per variant.

**`PhotoCapture.tsx`** — `<input type="file" accept="image/*" capture="environment">`. Shows preview after capture with "Retake" option. `onCapture(file: File)` prop. Required indicator.

**`ZoomSlider.tsx`** — Horizontal range input. `min`, `max`, `value`, `onChange`. Primark Blue thumb via CSS. Shows current value label.

**`DateRangePicker.tsx`** — Two `<input type="date">` fields. `from`, `to`, `onChange`. Default last 7 days.

**`DataTable.tsx`** — Sortable table. `columns: {key, label, render?}[]`, `data`, `sortBy`, `onSort`. Empty state built-in.

**`ConfirmDialog.tsx`** — Modal overlay. `title`, `message`, `onConfirm`, `onCancel`, `variant: 'default'|'danger'`. Danger variant uses red confirm button.

### `src/components/layout/`

**`NavBar.tsx`** — Top bar, `bg-navy h-14`. Left: "PRIMARK" + "VM.ai". Right: user name, store name, `LogOut` button that calls `logout()`.

**`BottomNav.tsx`** — Fixed bottom `bg-white border-t border-border-grey h-16`. Render tabs based on role:
- Scan (`ScanBarcode`): all roles → `/scan`
- Tasks (`ClipboardList`): vm_manager, store_manager, admin → `/tasks`
- Dashboard (`BarChart3`): store_manager, admin → `/dashboard`
- Admin (`Settings`): admin → `/admin`

**`PageHeader.tsx`** — `title`, optional `subtitle`, optional `action` (ReactNode). `text-2xl font-bold text-navy`.

### `src/components/scanning/`

**`BarcodeScanner.tsx`** — Wraps `useBarcodeScanner`. Renders the `html5-qrcode` viewfinder div. Semi-transparent targeting rectangle overlay centred in the camera feed. Zoom slider at bottom of viewfinder. Torch toggle icon top-left. Last scan result floating badge top-right (fades after 5s).

**`VMGuidelineCard.tsx`** — Full-width card with `product: VMProduct` prop. Shows VM reference image (full-width, pinch-to-zoom via CSS `touch-action: pinch-zoom`), product description, department badge, ORIN/KM label, price (AED + GBP), campaign label, source ref caption.

### `src/components/tasks/`

**`TaskCard.tsx`** — `task: VMTask` prop. Shows severity badge, due date with overdue highlight, product description, ORIN/KM, non-compliance type label, flagged photo thumbnail, reporter name + timestamp. Tap → navigate to `/tasks/:id`.

**`ComparisonView.tsx`** — Two images side-by-side on tablet, stacked on mobile. `guidelineImage: string`, `actualPhoto: string | null`. Labels "VM Guideline" and "Actual Display".

---

## Phase 7: Screens

### `src/screens/LoginScreen.tsx`

- Full screen `bg-light-grey`
- Centred: "PRIMARK" (`text-primark-blue text-[28px] font-bold uppercase tracking-[0.2em]`) + "VM.ai" subtitle
- Store selector: `<select>` populated from `useStores()` (active, alphabetical)
- User selector: `<select>` filtered by selected store (active, alphabetical). Disabled until store selected.
- `<PinPad>` below selectors
- Correct PIN → `login()` → navigate to `/scan`
- Incorrect PIN → `hasError` prop on PinPad → shake animation + "Incorrect PIN" caption

### `src/screens/ScanScreen.tsx`

- Top 65%: `<BarcodeScanner>` with `onScan` callback
- On scan:
  1. `validateEAN13(ean)` — if invalid, toast "Invalid barcode — please try again."
  2. `getProductByEAN(ean)` — if not found, toast "Product not found in VM database."
  3. If found: log beep + haptic, navigate to `/product/${ean}`
- Bottom 35%: white card with rounded top corners (`rounded-t-2xl -mt-6 relative z-10`)
  - "Recent Checks" heading + "Today: X checks" counter
  - Scrollable list of recent `ComplianceRecord` rows (from `useCompliance` session state)
  - Each row: product description (left), `<ComplianceBadge>` (right), timestamp below
  - Empty state: `<EmptyState icon={ScanBarcode} message="Scan a product to check its VM display" />`
  - Tapping a row navigates back to `/product/${ean}` in review mode

### `src/screens/ProductScreen.tsx` (VM Guideline Display)

Route: `/product/:ean`

- Fetch product from `useVMData().getProductByEAN(ean)`. If not found, redirect to `/scan` with toast.
- `<PageHeader title={product.description} />`
- `<VMGuidelineCard product={product} />`
- Action buttons (full-width, stacked, `gap-3`):
  1. **"Confirm Match"** (primary): creates `compliant` record → navigate to `/scan` → toast "Compliance confirmed"
  2. **"Flag Issue"** (danger): navigate to `/flag/${ean}`
  3. **"Back"** (secondary): navigate to `/scan`

### `src/screens/FlagScreen.tsx` (Non-Compliance Form)

Route: `/flag/:ean`

- Product summary card (description, ORIN/KM, department) — non-editable
- Non-compliance type `<select>` (6 types from `NON_COMPLIANCE_LABELS`)
- Severity `<select>` (4 levels, default: medium)
- Description `<textarea>` (optional; required if type = 'other') placeholder "Describe the issue..."
- `<PhotoCapture>` — required before submit
- **"Submit"** (primary): validate → `usePhotoUpload()` → `createRecord(non_compliant)` → create vm_task → navigate to `/scan` → toast "Issue flagged successfully"
- **"Cancel"** (secondary): navigate back to `/product/${ean}`

Auto-assign task: query `users` where `store_id = currentUser.store_id AND role = 'vm_manager' AND is_active = true LIMIT 1`.

### `src/screens/TasksScreen.tsx`

Route: `/tasks`

- Tab bar: Open | In Progress | Completed (`useState` for active tab)
- Filtered task list via `useTasks()` (realtime subscription active)
- `<TaskCard>` per task, sorted by severity then `created_at`
- Overdue tasks: red border `border-danger border-l-4`
- Empty state per tab

### `src/screens/TaskDetailScreen.tsx`

Route: `/tasks/:id`

- `<PageHeader title="Task Detail" />`
- `<ComparisonView guidelineImage={task.guideline_image_url} actualPhoto={task.flagged_photo_url} />`
- Task info card: product, non-compliance type, severity, description, reporter, timestamp, due date
- Status controls:
  - `status === 'open'`: "Start Work" button → update to `in_progress`
  - `status === 'in_progress'`: "Mark Complete" button → requires `<PhotoCapture>` for evidence, then update to `completed`, set `completed_at`
  - Any status: "Close Task" → `<ConfirmDialog variant="danger">` with close reason dropdown
- Completed tasks: show `<ComparisonView>` with before (flagged photo) and after (evidence photo)

### `src/screens/DashboardScreen.tsx`

Route: `/dashboard`

- `<PageHeader title="Compliance Dashboard" />`
- `<DateRangePicker>` + store dropdown (admin only)
- Stat cards row (horizontal scroll on mobile):
  - Total Checks (`text-primark-blue`)
  - Compliance Rate (`text-success` if ≥ 80%, `text-danger` if < 80%)
  - Open Tasks (`text-warning` if > 0, `text-success` if 0)
- Charts (Recharts):
  - Stacked bar: checks per day (compliant = `#10B981`, non-compliant = `#EF4444`)
  - Doughnut: overall compliance rate — large percentage in centre
  - Horizontal bar: checks by department
- Recent checks `<DataTable>`:
  - Columns: Product, Colleague, Result, Department, Time
  - Default sort: `checked_at DESC`, limit 20
  - Empty state: "No compliance checks found for this period."
- Skeleton loaders on all sections while loading

### `src/screens/AdminScreen.tsx`

Route: `/admin`

- Tab bar: Users | Stores
- **Users tab**: `<DataTable>` of all users. Columns: Name, Email, Role, Store, Status. "Add User" button → inline form or modal. Toggle `is_active`.
- **Stores tab**: `<DataTable>` of all stores. Columns: Name, Code, Region, Status. "Add Store" → inline form. Toggle `is_active`.

---

## Phase 8: Routing & App Shell

### `src/App.tsx`

```typescript
// Route structure:
// /login                 -> LoginScreen (public)
// /scan                  -> ScanScreen (all authenticated)
// /product/:ean          -> ProductScreen (all authenticated)
// /flag/:ean             -> FlagScreen (all authenticated)
// /tasks                 -> TasksScreen (canViewTasks)
// /tasks/:id             -> TaskDetailScreen (canViewTasks)
// /dashboard             -> DashboardScreen (canViewDashboard)
// /admin                 -> AdminScreen (canManageUsers)
// /admin/users           -> AdminScreen users tab
// /admin/stores          -> AdminScreen stores tab
// * -> redirect to /scan (if authed) or /login

// ProtectedRoute: reads AuthContext, redirects to /login if no user
// RoleRoute: checks permission flag, shows toast + redirects to /scan if denied
```

### `src/main.tsx`

Wrap `<App>` with `<BrowserRouter>`, `<ToastProvider>`, `<AuthProvider>`, `<VMDataProvider>` in that order.

---

## Phase 9: Static Asset — VM Product Data

### `public/vm_product_data.json` structure

```json
[
  {
    "ean13": "5099301000012",
    "identifier_type": "ORIN",
    "identifier": "89977",
    "description": "Cross Body Bag",
    "department": "D1",
    "subdepartment": "Bags",
    "age_range": null,
    "price_aed": 35.00,
    "price_gbp": 7.00,
    "campaign": "UAE Spring 2026 A4 Solid",
    "vm_image": "images/spring26-01.jpg",
    "source_page": 1,
    "source_ref": "uae_Spring26_A4solid_pt_1"
  }
]
```

**IMPORTANT — Image Path Resolution:** The `vm_image` field contains a relative path like `"images/spring26-01.jpg"`. In a Vite project, files in `/public/` are served from the root. Always prepend `/` when building `<img src>`: use `resolveImagePath(product.vm_image)` from `src/lib/utils.ts` which returns `"/" + vmImage`. Never use the raw path — it breaks on non-root routes.

---

## Phase 10: Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| Camera access denied | Full-screen message with device-specific instructions to enable camera in Settings |
| Camera not available | "No camera detected. This app requires a device with a rear camera." |
| Invalid barcode format | Toast: "Invalid barcode — please try again." |
| Product not in VM data | Toast: "Product not found in VM database." |
| Photo upload failure | Toast: "Failed to upload photo. Please try again." Submission blocked. |
| Network failure on save | Toast: "Something went wrong. Please try again." with retry button |
| Unauthorised route | Redirect to `/scan` + toast "You don't have permission to view that page." |
| Session cleared | Redirect to `/login` |
| Supabase errors | Generic toast, `console.error` with full details |
| Empty lists | `<EmptyState>` on every screen |
| Loading states | Skeleton loaders matching content shape — no full-page spinners |

---

## Phase 11: Realtime Subscriptions

**`useTasks` — vm_tasks table:**
```typescript
supabase
  .channel('vm_tasks_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'vm_tasks',
    filter: `store_id=eq.${storeId}`,
  }, handleTaskChange)
  .subscribe();
```

**`useDashboardData` — compliance_records table:**
```typescript
supabase
  .channel('compliance_changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'compliance_records',
    filter: canViewAllStores ? undefined : `store_id=eq.${storeId}`,
  }, handleComplianceInsert)
  .subscribe();
```

Always clean up channels on unmount with `supabase.removeChannel(channel)`.

---

## Phase 12: Business Rules Summary

| Rule | Implementation |
|------|---------------|
| EAN-13 check digit validation | `validateEAN13()` in `src/lib/ean13.ts` — reject invalid barcodes before lookup |
| Scan debounce | 1.5s cooldown after successful scan in `useBarcodeScanner` |
| Scan lock | Disable scanner after successful decode; re-enable on return to `/scan` |
| Photo required for non-compliance | FlagScreen submit blocked until photo captured |
| Task auto-assign | Query vm_manager for current store on task creation |
| SLA due dates | Set automatically by Postgres trigger based on severity |
| Store scoping | Hooks filter by `user.store_id` unless `canViewAllStores = true` |
| Status transitions | open → in_progress → completed (evidence photo required) → closed |
| Description required for 'other' | FlagScreen validates: if `type === 'other'`, description is required |
| Audit logging | Every compliance record creation and task status change logged |

---

## Phase 13: README Requirements

`README.md` must include:

1. **Project overview**: VM.ai — what it is and who uses it
2. **Quick start**: clone, `npm install`, copy `.env.example` to `.env`, run Supabase SQL files in order, `npm run dev`
3. **Environment variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. **Supabase setup**: create project, run `schema.sql` → `indexes.sql` → `seed.sql`, create storage bucket
5. **Test accounts**: list of store/user/PIN combinations from seed data
6. **Static assets**: instructions for adding VM reference images to `/public/images/` and `vm_product_data.json` to `/public/`
7. **Mobile testing**: how to test camera scanning on a real device (use `vite --host` or deploy to Vercel/Netlify)
8. **Role capabilities table**
9. **Out of scope for POC**: list from spec Section 16

---

## Acceptance Criteria Checklist

### Login & Auth
- [ ] Login with store + user + 4-digit PIN
- [ ] Incorrect PIN rejected with shake animation
- [ ] Logout clears session and returns to `/login`
- [ ] All routes except `/login` redirect if not authenticated
- [ ] Role-based route guards enforced

### Scanning
- [ ] Rear camera activates with 2x zoom default
- [ ] Zoom adjustable via slider
- [ ] EAN-13 validated (13 digits + check digit)
- [ ] Invalid barcodes rejected with toast
- [ ] Unknown EAN shows "Product not found" toast
- [ ] Successful scan navigates to VM Guideline Display
- [ ] Beep + haptic on successful scan

### VM Guideline Display
- [ ] Product details shown correctly
- [ ] VM reference image with pinch-to-zoom
- [ ] "Confirm Match" saves compliant record
- [ ] "Flag Issue" opens non-compliance form

### Non-Compliance
- [ ] All 6 type options present
- [ ] Photo required before submit
- [ ] Creates compliance record + VM task
- [ ] Task auto-assigned to store VM manager
- [ ] Due date auto-calculated from severity

### Tasks
- [ ] Open / In Progress / Completed tabs
- [ ] Severity-sorted task list
- [ ] Overdue tasks highlighted
- [ ] Guideline vs actual photo comparison
- [ ] Status transitions with evidence photo for completion

### Dashboard
- [ ] 3 stat cards with correct values
- [ ] Date range filter works
- [ ] All 3 charts render with correct data
- [ ] Recent checks table populated
- [ ] Store-scoped for store_manager, cross-store for admin

### General
- [ ] Primark brand design applied throughout
- [ ] Mobile-first responsive layout
- [ ] Bottom nav with role-scoped tabs
- [ ] Empty states on all lists
- [ ] Skeleton loaders during data fetch
- [ ] Error toasts for all failure scenarios
- [ ] Seed data enables immediate testing
- [ ] Audit logging on compliance + task events
