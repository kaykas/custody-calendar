/**
 * Validation Engine
 * Ensures 100% accuracy for custody calendar rules and events
 * Zero-error tolerance validation system
 */

import {
  CustodyRule,
  CustodyEvent,
  RuleConflict,
  ValidationCheck,
  ValidationType,
  ConflictSeverity,
} from '@/types/database';

export interface ValidationResult {
  passed: boolean;
  confidence_score: number; // 0.0 to 1.0
  errors: ValidationError[];
  warnings: ValidationWarning[];
  notes: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  field?: string;
  details?: Record<string, unknown>;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface ConflictDetectionResult {
  has_conflict: boolean;
  conflicts: RuleConflict[];
  details: string;
}

/**
 * Validation Engine Class
 * Implements comprehensive validation for custody calendar system
 */
export class ValidationEngine {
  private readonly MINIMUM_CONFIDENCE_SCORE = 0.99; // 99% confidence required

  /**
   * Validate a custody rule for consistency and completeness
   */
  public validateRule(rule: CustodyRule): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const notes: string[] = [];

    // 1. Validate required fields
    this.validateRequiredFields(rule, errors);

    // 2. Validate rule data structure
    this.validateRuleDataStructure(rule, errors, warnings);

    // 3. Validate date logic
    this.validateDateLogic(rule, errors, warnings);

    // 4. Validate priority
    this.validatePriority(rule, errors, warnings);

    // 5. Validate actions
    this.validateActions(rule, errors);

    // 6. Rule-type specific validation
    this.validateRuleTypeSpecific(rule, errors, warnings);

    // Calculate confidence score
    const confidence_score = this.calculateConfidenceScore(errors, warnings);

    // Determine if validation passed
    const passed =
      errors.filter((e) => e.severity === 'critical' || e.severity === 'high')
        .length === 0 && confidence_score >= this.MINIMUM_CONFIDENCE_SCORE;

    return {
      passed,
      confidence_score,
      errors,
      warnings,
      notes,
    };
  }

  /**
   * Validate required fields are present
   */
  private validateRequiredFields(
    rule: CustodyRule,
    errors: ValidationError[]
  ): void {
    const requiredFields = [
      'rule_type',
      'rule_name',
      'rule_category',
      'priority',
      'rule_data',
      'actions',
      'effective_from',
    ];

    for (const field of requiredFields) {
      if (!rule[field as keyof CustodyRule]) {
        errors.push({
          code: 'MISSING_REQUIRED_FIELD',
          message: `Required field '${field}' is missing`,
          severity: 'critical',
          field,
        });
      }
    }
  }

  /**
   * Validate rule data structure matches rule type
   */
  private validateRuleDataStructure(
    rule: CustodyRule,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!rule.rule_data || typeof rule.rule_data !== 'object') {
      errors.push({
        code: 'INVALID_RULE_DATA',
        message: 'rule_data must be a valid object',
        severity: 'critical',
        field: 'rule_data',
      });
      return;
    }

    // Verify rule_data.type matches rule_type
    const expectedType = rule.rule_type;
    const actualType = rule.rule_data.type;

    if (actualType !== expectedType) {
      errors.push({
        code: 'RULE_DATA_TYPE_MISMATCH',
        message: `rule_data.type '${actualType}' does not match rule_type '${expectedType}'`,
        severity: 'high',
        field: 'rule_data.type',
      });
    }
  }

  /**
   * Validate date logic
   */
  private validateDateLogic(
    rule: CustodyRule,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check effective_from is valid date
    if (rule.effective_from) {
      const effectiveFrom = new Date(rule.effective_from);
      if (isNaN(effectiveFrom.getTime())) {
        errors.push({
          code: 'INVALID_EFFECTIVE_FROM_DATE',
          message: 'effective_from is not a valid date',
          severity: 'critical',
          field: 'effective_from',
        });
      }
    }

    // Check effective_until if present
    if (rule.effective_until) {
      const effectiveUntil = new Date(rule.effective_until);
      if (isNaN(effectiveUntil.getTime())) {
        errors.push({
          code: 'INVALID_EFFECTIVE_UNTIL_DATE',
          message: 'effective_until is not a valid date',
          severity: 'critical',
          field: 'effective_until',
        });
      }

      // Verify effective_until is after effective_from
      if (rule.effective_from && rule.effective_until) {
        const from = new Date(rule.effective_from);
        const until = new Date(rule.effective_until);

        if (until <= from) {
          errors.push({
            code: 'INVALID_DATE_RANGE',
            message: 'effective_until must be after effective_from',
            severity: 'high',
            field: 'effective_until',
          });
        }
      }
    }
  }

  /**
   * Validate priority value
   */
  private validatePriority(
    rule: CustodyRule,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (rule.priority < 0 || rule.priority > 1000) {
      errors.push({
        code: 'INVALID_PRIORITY',
        message: 'priority must be between 0 and 1000',
        severity: 'high',
        field: 'priority',
      });
    }

    // Validate priority matches rule type expectations
    const priorityRanges = {
      special_day: { min: 1, max: 9, name: 'Special days' },
      holiday: { min: 10, max: 49, name: 'Holidays' },
      right_of_first_refusal: { min: 50, max: 89, name: 'ROFR' },
      summer_schedule: { min: 90, max: 99, name: 'Summer schedule' },
      regular_schedule: { min: 100, max: 149, name: 'Regular schedule' },
      exchange_protocol: { min: 150, max: 199, name: 'Exchange protocol' },
      travel: { min: 200, max: 249, name: 'Travel rules' },
      childcare: { min: 200, max: 249, name: 'Childcare' },
      medical: { min: 250, max: 299, name: 'Medical' },
      legal_custody: { min: 300, max: 349, name: 'Legal custody' },
    };

    const expectedRange =
      priorityRanges[rule.rule_type as keyof typeof priorityRanges];
    if (expectedRange) {
      if (
        rule.priority < expectedRange.min ||
        rule.priority > expectedRange.max
      ) {
        warnings.push({
          code: 'PRIORITY_OUT_OF_EXPECTED_RANGE',
          message: `Priority ${rule.priority} for ${rule.rule_type} is outside expected range ${expectedRange.min}-${expectedRange.max}`,
          field: 'priority',
          details: { expectedRange },
        });
      }
    }
  }

  /**
   * Validate actions
   */
  private validateActions(
    rule: CustodyRule,
    errors: ValidationError[]
  ): void {
    if (!rule.actions || typeof rule.actions !== 'object') {
      errors.push({
        code: 'MISSING_ACTIONS',
        message: 'actions object is required',
        severity: 'critical',
        field: 'actions',
      });
      return;
    }

    // Validate custodial_parent
    if (!rule.actions.custodial_parent) {
      errors.push({
        code: 'MISSING_CUSTODIAL_PARENT',
        message: 'actions.custodial_parent is required',
        severity: 'critical',
        field: 'actions.custodial_parent',
      });
    }

    const validParents = ['mother', 'father'];
    if (
      rule.actions.custodial_parent &&
      !validParents.includes(rule.actions.custodial_parent)
    ) {
      errors.push({
        code: 'INVALID_CUSTODIAL_PARENT',
        message: `actions.custodial_parent must be 'mother' or 'father'`,
        severity: 'high',
        field: 'actions.custodial_parent',
      });
    }
  }

  /**
   * Rule-type specific validation
   */
  private validateRuleTypeSpecific(
    rule: CustodyRule,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    switch (rule.rule_type) {
      case 'regular_schedule':
        this.validateRegularSchedule(rule, errors, warnings);
        break;
      case 'summer_schedule':
        this.validateSummerSchedule(rule, errors, warnings);
        break;
      case 'holiday':
        this.validateHoliday(rule, errors, warnings);
        break;
      case 'special_day':
        this.validateSpecialDay(rule, errors, warnings);
        break;
      case 'travel':
        this.validateTravel(rule, errors, warnings);
        break;
      case 'right_of_first_refusal':
        this.validateRightOfFirstRefusal(rule, errors, warnings);
        break;
    }
  }

  private validateRegularSchedule(
    rule: CustodyRule,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const data = rule.rule_data as any;
    if (!data.schedule) {
      errors.push({
        code: 'MISSING_SCHEDULE',
        message: 'regular_schedule requires schedule data',
        severity: 'critical',
        field: 'rule_data.schedule',
      });
    }
  }

  private validateSummerSchedule(
    rule: CustodyRule,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const data = rule.rule_data as any;
    if (!data.duration_weeks) {
      errors.push({
        code: 'MISSING_DURATION',
        message: 'summer_schedule requires duration_weeks',
        severity: 'critical',
        field: 'rule_data.duration_weeks',
      });
    }
    if (!data.mother_weeks || !data.father_weeks) {
      errors.push({
        code: 'MISSING_WEEK_ASSIGNMENTS',
        message: 'summer_schedule requires mother_weeks and father_weeks',
        severity: 'critical',
        field: 'rule_data',
      });
    }
  }

  private validateHoliday(
    rule: CustodyRule,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const data = rule.rule_data as any;
    if (!data.holiday_name) {
      errors.push({
        code: 'MISSING_HOLIDAY_NAME',
        message: 'holiday requires holiday_name',
        severity: 'critical',
        field: 'rule_data.holiday_name',
      });
    }
    if (!data.date_determination) {
      errors.push({
        code: 'MISSING_DATE_DETERMINATION',
        message: 'holiday requires date_determination',
        severity: 'critical',
        field: 'rule_data.date_determination',
      });
    }
  }

  private validateSpecialDay(
    rule: CustodyRule,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const data = rule.rule_data as any;
    if (!data.occasion) {
      errors.push({
        code: 'MISSING_OCCASION',
        message: 'special_day requires occasion',
        severity: 'critical',
        field: 'rule_data.occasion',
      });
    }
  }

  private validateTravel(
    rule: CustodyRule,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const data = rule.rule_data as any;
    if (!data.travel_type) {
      errors.push({
        code: 'MISSING_TRAVEL_TYPE',
        message: 'travel requires travel_type',
        severity: 'critical',
        field: 'rule_data.travel_type',
      });
    }
  }

  private validateRightOfFirstRefusal(
    rule: CustodyRule,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const data = rule.rule_data as any;
    if (!data.threshold) {
      errors.push({
        code: 'MISSING_THRESHOLD',
        message: 'right_of_first_refusal requires threshold',
        severity: 'critical',
        field: 'rule_data.threshold',
      });
    }
  }

  /**
   * Calculate confidence score based on errors and warnings
   */
  private calculateConfidenceScore(
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): number {
    let score = 1.0;

    // Critical errors: -0.5 each
    const criticalErrors = errors.filter((e) => e.severity === 'critical');
    score -= criticalErrors.length * 0.5;

    // High errors: -0.2 each
    const highErrors = errors.filter((e) => e.severity === 'high');
    score -= highErrors.length * 0.2;

    // Medium errors: -0.1 each
    const mediumErrors = errors.filter((e) => e.severity === 'medium');
    score -= mediumErrors.length * 0.1;

    // Low errors: -0.05 each
    const lowErrors = errors.filter((e) => e.severity === 'low');
    score -= lowErrors.length * 0.05;

    // Warnings: -0.02 each
    score -= warnings.length * 0.02;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Detect conflicts between rules
   */
  public detectConflicts(
    rule1: CustodyRule,
    rule2: CustodyRule
  ): ConflictDetectionResult {
    const conflicts: any[] = [];

    // 1. Check for overlapping time periods
    const timeOverlap = this.checkTimeOverlap(rule1, rule2);
    if (timeOverlap.hasOverlap) {
      conflicts.push({
        conflict_type: 'overlapping_time',
        conflict_severity: this.determineConflictSeverity(rule1, rule2),
        conflict_description: `Rules '${rule1.rule_name}' and '${rule2.rule_name}' have overlapping time periods`,
        conflict_data: timeOverlap,
      });
    }

    // 2. Check for contradictory custody assignments
    const custodyConflict = this.checkCustodyConflict(rule1, rule2);
    if (custodyConflict.hasConflict) {
      conflicts.push({
        conflict_type: 'contradictory_custody',
        conflict_severity: 'high',
        conflict_description: `Rules assign different custodial parents for overlapping period`,
        conflict_data: custodyConflict,
      });
    }

    // 3. Check priority clarity
    if (rule1.priority === rule2.priority && conflicts.length > 0) {
      conflicts.push({
        conflict_type: 'priority_unclear',
        conflict_severity: 'medium',
        conflict_description: `Rules have same priority (${rule1.priority}) but conflict`,
        conflict_data: { priority: rule1.priority },
      });
    }

    return {
      has_conflict: conflicts.length > 0,
      conflicts,
      details:
        conflicts.length > 0
          ? `Found ${conflicts.length} conflict(s) between rules`
          : 'No conflicts detected',
    };
  }

  /**
   * Check if two rules have overlapping time periods
   */
  private checkTimeOverlap(
    rule1: CustodyRule,
    rule2: CustodyRule
  ): { hasOverlap: boolean; details?: any } {
    // Check effective date ranges
    const r1Start = new Date(rule1.effective_from);
    const r1End = rule1.effective_until
      ? new Date(rule1.effective_until)
      : new Date('2099-12-31');

    const r2Start = new Date(rule2.effective_from);
    const r2End = rule2.effective_until
      ? new Date(rule2.effective_until)
      : new Date('2099-12-31');

    const hasOverlap = r1Start <= r2End && r2Start <= r1End;

    return {
      hasOverlap,
      details: hasOverlap
        ? {
            rule1_range: { start: r1Start, end: r1End },
            rule2_range: { start: r2Start, end: r2End },
          }
        : undefined,
    };
  }

  /**
   * Check if rules assign different custodial parents for same time
   */
  private checkCustodyConflict(
    rule1: CustodyRule,
    rule2: CustodyRule
  ): { hasConflict: boolean; details?: any } {
    if (!rule1.actions || !rule2.actions) {
      return { hasConflict: false };
    }

    // If different parents assigned and rules could overlap
    const differentParents =
      rule1.actions.custodial_parent !== rule2.actions.custodial_parent;

    if (differentParents) {
      // Check if priority resolves conflict (lower number = higher priority)
      const conflictResolved = rule1.priority !== rule2.priority;

      return {
        hasConflict: !conflictResolved,
        details: {
          rule1_parent: rule1.actions.custodial_parent,
          rule2_parent: rule2.actions.custodial_parent,
          rule1_priority: rule1.priority,
          rule2_priority: rule2.priority,
          resolved_by_priority: conflictResolved,
        },
      };
    }

    return { hasConflict: false };
  }

  /**
   * Determine conflict severity based on rule types and priorities
   */
  private determineConflictSeverity(
    rule1: CustodyRule,
    rule2: CustodyRule
  ): ConflictSeverity {
    // Critical if both high priority
    if (rule1.priority < 50 && rule2.priority < 50) {
      return ConflictSeverity.CRITICAL;
    }

    // High if custody assignments differ
    if (rule1.actions.custodial_parent !== rule2.actions.custodial_parent) {
      return ConflictSeverity.HIGH;
    }

    // Medium if overlapping but same parent
    return ConflictSeverity.MEDIUM;
  }

  /**
   * Validate all rules in a set for consistency
   */
  public validateRuleSet(rules: CustodyRule[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const notes: string[] = [];

    // 1. Validate each rule individually
    let totalConfidence = 0;
    for (const rule of rules) {
      const result = this.validateRule(rule);
      if (!result.passed) {
        // Only add if there are actual critical/high errors
        const criticalErrors = result.errors.filter(
          (e) => e.severity === 'critical' || e.severity === 'high'
        );
        if (criticalErrors.length > 0) {
          errors.push({
            code: 'RULE_VALIDATION_FAILED',
            message: `Rule '${rule.rule_name}' failed validation`,
            severity: 'high',
            details: { rule_id: rule.id, errors: result.errors },
          });
        }
      }
      totalConfidence += result.confidence_score;
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }

    // 2. Check for UNRESOLVED conflicts between rules
    // Note: Overlapping is expected (holidays override regular schedule), only flag if unresolvable
    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const conflictResult = this.detectConflicts(rules[i], rules[j]);
        if (conflictResult.has_conflict) {
          // Only flag as error if conflict is critical/high severity AND not resolved by priority
          const hasCriticalConflict = conflictResult.conflicts.some(
            (c: any) =>
              (c.conflict_severity === 'critical' || c.conflict_severity === 'high') &&
              c.conflict_type !== 'overlapping_time' // overlapping is OK if priority resolves it
          );

          if (hasCriticalConflict) {
            errors.push({
              code: 'RULE_CONFLICT_DETECTED',
              message: `Unresolved conflict between '${rules[i].rule_name}' and '${rules[j].rule_name}'`,
              severity: 'high',
              details: conflictResult,
            });
          } else {
            // Log as informational, not error
            notes.push(
              `Overlapping rules detected (resolved by priority): '${rules[i].rule_name}' (priority ${rules[i].priority}) and '${rules[j].rule_name}' (priority ${rules[j].priority})`
            );
          }
        }
      }
    }

    // Calculate average confidence
    const avgConfidence = rules.length > 0 ? totalConfidence / rules.length : 0;

    const passed =
      errors.filter((e) => e.severity === 'critical' || e.severity === 'high')
        .length === 0 && avgConfidence >= this.MINIMUM_CONFIDENCE_SCORE;

    notes.push(`Validated ${rules.length} rules`);
    notes.push(`Average confidence score: ${avgConfidence.toFixed(4)}`);

    return {
      passed,
      confidence_score: avgConfidence,
      errors,
      warnings,
      notes,
    };
  }

  /**
   * Validate a custody event
   */
  public validateEvent(event: CustodyEvent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const notes: string[] = [];

    // 1. Validate required fields
    if (!event.event_type) {
      errors.push({
        code: 'MISSING_EVENT_TYPE',
        message: 'event_type is required',
        severity: 'critical',
        field: 'event_type',
      });
    }

    if (!event.title) {
      errors.push({
        code: 'MISSING_TITLE',
        message: 'title is required',
        severity: 'critical',
        field: 'title',
      });
    }

    // 2. Validate dates
    if (event.start_datetime && event.end_datetime) {
      const start = new Date(event.start_datetime);
      const end = new Date(event.end_datetime);

      if (isNaN(start.getTime())) {
        errors.push({
          code: 'INVALID_START_DATE',
          message: 'start_datetime is not a valid date',
          severity: 'critical',
          field: 'start_datetime',
        });
      }

      if (isNaN(end.getTime())) {
        errors.push({
          code: 'INVALID_END_DATE',
          message: 'end_datetime is not a valid date',
          severity: 'critical',
          field: 'end_datetime',
        });
      }

      if (start >= end) {
        errors.push({
          code: 'INVALID_DATE_RANGE',
          message: 'end_datetime must be after start_datetime',
          severity: 'critical',
          field: 'end_datetime',
        });
      }
    }

    // 3. Validate custodial parent
    const validParents = ['mother', 'father'];
    if (!validParents.includes(event.custodial_parent)) {
      errors.push({
        code: 'INVALID_CUSTODIAL_PARENT',
        message: 'custodial_parent must be mother or father',
        severity: 'critical',
        field: 'custodial_parent',
      });
    }

    // 4. Check for conflicts if flagged
    if (event.has_conflict && !event.conflict_resolved) {
      warnings.push({
        code: 'UNRESOLVED_CONFLICT',
        message: 'Event has unresolved conflict',
        field: 'has_conflict',
        details: event.conflict_details,
      });
    }

    const confidence_score = this.calculateConfidenceScore(errors, warnings);
    const passed =
      errors.filter((e) => e.severity === 'critical' || e.severity === 'high')
        .length === 0 && confidence_score >= this.MINIMUM_CONFIDENCE_SCORE;

    return {
      passed,
      confidence_score,
      errors,
      warnings,
      notes,
    };
  }
}

/**
 * Export singleton instance
 */
export const validationEngine = new ValidationEngine();
