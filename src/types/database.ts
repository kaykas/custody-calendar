/**
 * Database Type Definitions
 * Generated from PostgreSQL schema for Roberts v. Gardenhire custody calendar
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum CaseStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  PENDING = 'pending',
}

export enum RuleType {
  REGULAR_SCHEDULE = 'regular_schedule',
  SUMMER_SCHEDULE = 'summer_schedule',
  HOLIDAY = 'holiday',
  SPECIAL_DAY = 'special_day',
  TRAVEL = 'travel',
  RIGHT_OF_FIRST_REFUSAL = 'right_of_first_refusal',
  MEDICAL = 'medical',
  LEGAL_CUSTODY = 'legal_custody',
  EXCHANGE_PROTOCOL = 'exchange_protocol',
  CHILDCARE = 'childcare',
  COMMUNICATION = 'communication',
}

export enum RuleCategory {
  PHYSICAL_CUSTODY = 'physical_custody',
  LEGAL_CUSTODY = 'legal_custody',
  MEDICAL = 'medical',
  TRAVEL = 'travel',
  OTHER = 'other',
}

export enum EventType {
  CUSTODY_PERIOD = 'custody_period',
  EXCHANGE = 'exchange',
  HOLIDAY = 'holiday',
  SPECIAL_DAY = 'special_day',
  TRAVEL = 'travel',
  OTHER = 'other',
}

export enum EventStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  MODIFIED = 'modified',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum CustodialParent {
  MOTHER = 'mother',
  FATHER = 'father',
}

export enum ValidationType {
  RULE_EXTRACTION = 'rule_extraction',
  RULE_CONSISTENCY = 'rule_consistency',
  EVENT_GENERATION = 'event_generation',
  CONFLICT_DETECTION = 'conflict_detection',
  DATE_CALCULATION = 'date_calculation',
  MANUAL_REVIEW = 'manual_review',
}

export enum ConflictSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum ChangeType {
  COURT_ORDER = 'court_order',
  MANUAL_CORRECTION = 'manual_correction',
  SYSTEM_GENERATED = 'system_generated',
  CONFLICT_RESOLUTION = 'conflict_resolution',
}

// ============================================================================
// CHILD INFORMATION
// ============================================================================

export interface Child {
  first_name: string;
  middle_name?: string;
  last_name: string;
  nickname?: string;
  dob: string; // ISO date format: YYYY-MM-DD
  age: number;
}

// ============================================================================
// RULE DATA STRUCTURES
// ============================================================================

export interface RegularScheduleRuleData {
  type: 'regular_schedule';
  schedule: {
    weekday_periods?: {
      day: string; // 'thursday'
      start_time: string; // 'school_pickup' or 'HH:MM'
      end_time: string; // 'school_dropoff' or 'HH:MM'
      custodial_parent: CustodialParent;
    }[];
    weekend_periods?: {
      frequency: 'alternating' | 'every' | 'first' | 'second' | 'third' | 'fourth' | 'fifth';
      start_day: string; // 'friday'
      start_time: string; // 'school_pickup' or 'HH:MM'
      end_day: string; // 'monday'
      end_time: string; // 'school_dropoff' or 'HH:MM'
      custodial_parent: CustodialParent;
      weeks?: number[]; // [1, 3, 5] for alternating
    }[];
  };
  exchange_rules?: {
    location_type: 'school' | 'home_curbside' | 'specific_location';
    location_details?: string;
    protocol?: string;
  };
  school_holiday_extension?: {
    extends_to: string; // 'tuesday_morning'
    applies_when: string; // 'monday_is_holiday'
  };
}

export interface SummerScheduleRuleData {
  type: 'summer_schedule';
  duration_weeks: number; // 8
  schedule_pattern: 'week_on_week_off';
  mother_weeks: number[]; // [1, 3, 5, 7]
  father_weeks: number[]; // [2, 4, 6, 8]
  start_determination: {
    condition: string; // 'last_day_is_friday' | 'last_day_not_friday'
    start_time_if_friday: string; // 'school_pickup'
    start_time_otherwise: string; // 'friday_4pm'
  };
  exchange_rules: {
    day: string; // 'friday'
    time: string; // 'camp_pickup' or '16:00'
    alternate_time_no_camp: string; // '16:00'
    location_type: 'camp' | 'home_curbside';
  };
  transition_to_school_year: {
    method: 'weekend_determination';
    description: string;
  };
}

export interface HolidayRuleData {
  type: 'holiday';
  holiday_name: string;
  year_pattern: 'odd' | 'even' | 'all';
  custodial_parent_odd?: CustodialParent;
  custodial_parent_even?: CustodialParent;
  split_holiday?: boolean;
  split_details?: {
    first_half_parent_odd: CustodialParent;
    first_half_parent_even: CustodialParent;
    split_datetime: string; // 'noon_wednesday_before_thanksgiving'
  };
  date_determination: {
    method: 'fixed_date' | 'relative_date' | 'date_range';
    fixed_date?: string; // 'MM-DD'
    relative_date?: {
      base: string; // 'thanksgiving'
      offset_days: number;
    };
    date_range?: {
      start: string;
      end: string;
      calculation_method: string;
    };
  };
  exchange_time?: {
    start: string;
    end: string;
  };
}

export interface SpecialDayRuleData {
  type: 'special_day';
  occasion: string; // 'mothers_day' | 'fathers_day' | 'mother_birthday' | 'father_birthday'
  custodial_parent: CustodialParent;
  duration_hours: number; // 24
  start_time: string; // '09:00'
  end_time: string; // '09:00' (next day) or 'school_dropoff'
  date_determination: {
    method: 'fixed_date' | 'specific_sunday' | 'birthday';
    date?: string; // 'MM-DD' for birthdays
    relative?: string; // 'second_sunday_may'
  };
  exchange_location?: string;
}

export interface TravelRuleData {
  type: 'travel';
  travel_type: 'domestic' | 'international';
  requires_consent: boolean;
  notice_period_days: number; // 30 for domestic, 60 for international
  required_information: string[];
  consent_rules?: {
    cannot_unreasonably_withhold: boolean;
    document_requirements: string[];
    document_delivery_days_before: number;
  };
}

export interface RightOfFirstRefusalRuleData {
  type: 'right_of_first_refusal';
  threshold: {
    duration: number; // 1
    unit: 'overnights' | 'hours';
    operator: 'more_than' | 'at_least';
  };
  notification_period_hours: number; // 24
  response_period_hours: number; // 24
  applies_to: 'both' | 'mother' | 'father';
  exclusions?: string[];
}

export interface ChildcareRuleData {
  type: 'childcare';
  notification_required: boolean;
  allowed_providers: {
    type: 'specific_person' | 'third_party';
    name?: string;
    age_requirement?: number;
    max_hours_per_session?: number;
    max_sessions_per_week?: number;
    location_restriction?: string;
  }[];
  information_sharing_requirement: string;
}

export type RuleData =
  | RegularScheduleRuleData
  | SummerScheduleRuleData
  | HolidayRuleData
  | SpecialDayRuleData
  | TravelRuleData
  | RightOfFirstRefusalRuleData
  | ChildcareRuleData;

// ============================================================================
// RULE CONDITIONS
// ============================================================================

export interface RuleConditions {
  year_type?: 'odd' | 'even' | 'all';
  month?: number; // 1-12
  day_of_month?: number; // 1-31
  day_range?: [number, number];
  day_of_week?: number; // 0-6 (Sunday = 0)
  date_range?: {
    start: string; // ISO date
    end: string; // ISO date
  };
  season?: 'summer' | 'school_year';
  school_in_session?: boolean;
  applies_to_children?: string[]; // Array of child names or 'all'
}

// ============================================================================
// RULE ACTIONS
// ============================================================================

export interface RuleActions {
  custodial_parent: CustodialParent;
  start_time: string;
  end_time: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  exchange_location?: string;
  notes?: string;
}

// ============================================================================
// DATABASE TABLES
// ============================================================================

export interface CustodyCase {
  id: string; // UUID
  case_number: string;
  court_name: string;
  county: string;
  state: string;

  hearing_date?: Date;
  presiding_judge?: string;
  department?: string;
  case_status: CaseStatus;

  // Mother
  mother_first_name: string;
  mother_middle_name?: string;
  mother_last_name: string;
  mother_dob: Date;
  mother_email?: string;
  mother_phone?: string;

  // Father
  father_first_name: string;
  father_middle_name?: string;
  father_last_name: string;
  father_dob: Date;
  father_email?: string;
  father_phone?: string;

  // Children
  children: Child[];

  // Metadata
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface CustodyRule {
  id: string; // UUID
  case_id: string; // UUID reference
  rule_type: RuleType;
  rule_name: string;
  rule_category: RuleCategory;
  priority: number;

  rule_data: RuleData;
  conditions?: RuleConditions;
  actions: RuleActions;

  source_document?: string;
  source_page?: number;
  source_section?: string;
  extracted_text?: string;

  is_validated: boolean;
  validation_notes?: string;
  validated_by?: string;
  validated_at?: Date;

  effective_from: Date;
  effective_until?: Date;

  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface CustodyEvent {
  id: string; // UUID
  case_id: string; // UUID reference
  rule_id?: string; // UUID reference

  event_type: EventType;
  title: string;
  description?: string;

  start_datetime: Date;
  end_datetime: Date;
  all_day: boolean;

  custodial_parent: CustodialParent;
  location?: string;
  exchange_location?: string;

  applied_rule_data: RuleData;

  has_conflict: boolean;
  conflict_details?: Record<string, unknown>;
  conflict_resolved: boolean;
  conflict_resolution_notes?: string;

  status: EventStatus;
  is_modified: boolean;
  modification_notes?: string;
  original_event_id?: string; // UUID reference

  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface ValidationCheck {
  id: string; // UUID
  case_id: string; // UUID reference

  validation_type: ValidationType;
  validation_target_type: string;
  validation_target_id?: string; // UUID

  validation_method: string;
  validation_criteria: Record<string, unknown>;
  validation_input?: Record<string, unknown>;
  validation_output?: Record<string, unknown>;

  passed: boolean;
  confidence_score?: number; // 0.0 to 1.0
  validation_errors?: Record<string, unknown>;
  validation_warnings?: Record<string, unknown>;
  validation_notes?: string;

  validated_by: string;
  validation_tool?: string;

  created_at: Date;
}

export interface AuditLog {
  id: string; // UUID
  table_name: string;
  record_id: string; // UUID
  operation: 'INSERT' | 'UPDATE' | 'DELETE';

  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  changed_fields?: string[];

  case_id?: string; // UUID reference
  change_reason?: string;
  change_type?: ChangeType;

  changed_by: string;
  changed_by_role?: string;
  ip_address?: string;
  user_agent?: string;

  created_at: Date;
}

export interface RuleConflict {
  id: string; // UUID
  case_id: string; // UUID reference
  rule_id_1: string; // UUID reference
  rule_id_2: string; // UUID reference

  conflict_type: string;
  conflict_description: string;
  conflict_severity: ConflictSeverity;
  conflict_data: Record<string, unknown>;

  is_resolved: boolean;
  resolution_method?: string;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: Date;

  detected_at: Date;
  created_by?: string;
}

// ============================================================================
// INPUT TYPES FOR CREATION
// ============================================================================

export type CreateCustodyCase = Omit<
  CustodyCase,
  'id' | 'created_at' | 'updated_at'
>;

export type CreateCustodyRule = Omit<
  CustodyRule,
  'id' | 'created_at' | 'updated_at' | 'is_validated'
>;

export type CreateCustodyEvent = Omit<
  CustodyEvent,
  'id' | 'created_at' | 'updated_at'
>;

export type CreateValidationCheck = Omit<ValidationCheck, 'id' | 'created_at'>;
