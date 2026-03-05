export type UserRole = 'store_colleague' | 'vm_manager' | 'store_manager' | 'admin';
export type ComplianceStatus = 'compliant' | 'non_compliant';
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'closed';
export type NonComplianceType =
  | 'missing_pos'
  | 'wrong_position'
  | 'wrong_fixture'
  | 'damaged_display'
  | 'outdated_promotion'
  | 'other';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type IdentifierType = 'ORIN' | 'KM_CODE';
export type CloseReason =
  | 'duplicate'
  | 'not_applicable'
  | 'resolved_externally'
  | 'product_removed';

export interface Store {
  id: string;
  name: string;
  store_code: string;
  region: string | null;
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  pin: string;
  store_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  vm_image: string;
  source_page: number;
  source_ref: string;
  expiry_date?: string;
  pos_format?: string;
}

export interface ComplianceRecord {
  id: string;
  ean: string;
  orin_or_km: string;
  identifier_type: IdentifierType;
  product_description: string;
  department: string;
  campaign: string | null;
  status: ComplianceStatus;
  photo_url: string | null;
  guideline_image_url: string | null;
  user_id: string;
  store_id: string;
  checked_at: string;
  user?: User;
  store?: Store;
}

export interface VMTask {
  id: string;
  compliance_record_id: string;
  store_id: string;
  assigned_to: string;
  reported_by: string;
  non_compliance_type: NonComplianceType;
  severity: Severity;
  description: string | null;
  flagged_photo_url: string | null;
  guideline_image_url: string | null;
  evidence_photo_url: string | null;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  close_reason: CloseReason | null;
  compliance_record?: ComplianceRecord;
  assigned_user?: User;
  reporter?: User;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  store_colleague: 'Store Colleague',
  vm_manager: 'VM Manager',
  store_manager: 'Store Manager',
  admin: 'Administrator',
};

export const NON_COMPLIANCE_LABELS: Record<NonComplianceType, string> = {
  missing_pos: 'Missing POS Material',
  wrong_position: 'Wrong Position',
  wrong_fixture: 'Wrong Fixture',
  damaged_display: 'Damaged Display',
  outdated_promotion: 'Outdated Promotion',
  other: 'Other',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const CLOSE_REASON_LABELS: Record<CloseReason, string> = {
  duplicate: 'Duplicate',
  not_applicable: 'Not Applicable',
  resolved_externally: 'Resolved Externally',
  product_removed: 'Product Removed from Display',
};
