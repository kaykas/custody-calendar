/**
 * Rule Extraction Engine
 * Extracts custody rules from court order for Roberts v. Gardenhire
 * Designed for 100% accuracy with comprehensive validation
 */

import {
  CustodyRule,
  RuleType,
  RuleCategory,
  CustodialParent,
  RegularScheduleRuleData,
  SummerScheduleRuleData,
  HolidayRuleData,
  SpecialDayRuleData,
  TravelRuleData,
  RightOfFirstRefusalRuleData,
  ChildcareRuleData,
} from '@/types/database';

// ============================================================================
// ROBERTS V. GARDENHIRE COURT ORDER DATA
// Court Order Date: September 30, 2025
// Case Number: FPT-25-378556
// ============================================================================

export interface ExtractedRule {
  rule_type: RuleType;
  rule_name: string;
  rule_category: RuleCategory;
  priority: number;
  rule_data: any;
  conditions?: any;
  actions: any;
  source_document: string;
  source_page: number;
  source_section: string;
  extracted_text: string;
  effective_from: string; // ISO date
  effective_until?: string; // ISO date
}

export class RuleExtractor {
  private caseNumber = 'FPT-25-378556';
  private courtOrderDate = '2025-09-30';
  private sourceDocument = 'RobertsTR.pdf';

  /**
   * Extract all rules from the Roberts v. Gardenhire court order
   */
  public extractAllRules(): ExtractedRule[] {
    const rules: ExtractedRule[] = [];

    // Regular Schedule Rules
    rules.push(...this.extractRegularScheduleRules());

    // Summer Schedule Rules
    rules.push(...this.extractSummerScheduleRules());

    // Holiday Rules
    rules.push(...this.extractHolidayRules());

    // Special Day Rules
    rules.push(...this.extractSpecialDayRules());

    // Travel Rules
    rules.push(...this.extractTravelRules());

    // Right of First Refusal
    rules.push(this.extractRightOfFirstRefusalRule());

    // Childcare Rules
    rules.push(this.extractChildcareRule());

    // Exchange Protocol
    rules.push(this.extractExchangeProtocolRule());

    return rules;
  }

  /**
   * Extract Regular (School Year) Parenting Time Schedule
   * Source: Page 3, Section 12
   */
  private extractRegularScheduleRules(): ExtractedRule[] {
    const rules: ExtractedRule[] = [];

    // Rule 1: Thursday Overnight (Every Week)
    rules.push({
      rule_type: RuleType.REGULAR_SCHEDULE,
      rule_name: 'Mother - Thursday Overnight (Every Week)',
      rule_category: RuleCategory.PHYSICAL_CUSTODY,
      priority: 100,
      rule_data: {
        type: 'regular_schedule',
        schedule: {
          weekday_periods: [
            {
              day: 'thursday',
              start_time: 'school_pickup',
              end_time: 'friday_school_dropoff',
              custodial_parent: CustodialParent.MOTHER,
            },
          ],
        },
        exchange_rules: {
          location_type: 'school',
          protocol: 'brief_and_polite',
        },
      } as RegularScheduleRuleData,
      conditions: {
        season: 'school_year',
        school_in_session: true,
        applies_to_children: 'all',
      },
      actions: {
        custodial_parent: CustodialParent.MOTHER,
        start_time: 'school_pickup',
        end_time: 'school_dropoff',
      },
      source_document: this.sourceDocument,
      source_page: 3,
      source_section: '12.a',
      extracted_text:
        'With Mother every week from Thursday afternoon school pickup to Friday morning school drop-off.',
      effective_from: this.courtOrderDate,
    });

    // Rule 2: Alternating Weekends (Mother)
    rules.push({
      rule_type: RuleType.REGULAR_SCHEDULE,
      rule_name: 'Mother - Alternating Weekends',
      rule_category: RuleCategory.PHYSICAL_CUSTODY,
      priority: 100,
      rule_data: {
        type: 'regular_schedule',
        schedule: {
          weekend_periods: [
            {
              frequency: 'alternating',
              start_day: 'friday',
              start_time: 'school_pickup',
              end_day: 'monday',
              end_time: 'school_dropoff',
              custodial_parent: CustodialParent.MOTHER,
            },
          ],
        },
        exchange_rules: {
          location_type: 'school',
          protocol: 'brief_and_polite',
        },
        school_holiday_extension: {
          extends_to: 'tuesday_morning',
          applies_when: 'monday_is_holiday',
        },
      } as RegularScheduleRuleData,
      conditions: {
        season: 'school_year',
        school_in_session: true,
        applies_to_children: 'all',
      },
      actions: {
        custodial_parent: CustodialParent.MOTHER,
        start_time: 'school_pickup',
        end_time: 'school_dropoff',
      },
      source_document: this.sourceDocument,
      source_page: 3,
      source_section: '12.b, 12.d',
      extracted_text:
        'With Mother every other (alternating) weekends from Friday afternoon school pickup to Monday morning school drop-off. If a Monday is a school holiday, the custodial parent\'s time shall extend until Tuesday morning school drop-off.',
      effective_from: this.courtOrderDate,
    });

    // Rule 3: No School Exchange Location
    rules.push({
      rule_type: RuleType.EXCHANGE_PROTOCOL,
      rule_name: 'Exchange Location - No School',
      rule_category: RuleCategory.PHYSICAL_CUSTODY,
      priority: 150,
      rule_data: {
        type: 'exchange_protocol',
        location_type: 'home_curbside',
        location_details: 'receiving parent\'s home, curbside',
        applies_when: 'school_not_in_session',
      },
      conditions: {
        school_in_session: false,
      },
      actions: {
        custodial_parent: CustodialParent.MOTHER, // placeholder, applies to both
        start_time: '',
        end_time: '',
        exchange_location: 'receiving_parent_home_curbside',
      },
      source_document: this.sourceDocument,
      source_page: 3,
      source_section: '12.c',
      extracted_text:
        'If school is not in session exchanges shall occur at the receiving parent\'s home, curbside.',
      effective_from: this.courtOrderDate,
    });

    return rules;
  }

  /**
   * Extract Summer Vacation Parenting Time Schedule
   * Source: Page 3-4, Section 14
   */
  private extractSummerScheduleRules(): ExtractedRule[] {
    const rules: ExtractedRule[] = [];

    // Summer 8-Week Rotation
    rules.push({
      rule_type: RuleType.SUMMER_SCHEDULE,
      rule_name: 'Summer - 8 Week Rotation (Week On/Week Off)',
      rule_category: RuleCategory.PHYSICAL_CUSTODY,
      priority: 90, // Higher priority than regular schedule
      rule_data: {
        type: 'summer_schedule',
        duration_weeks: 8,
        schedule_pattern: 'week_on_week_off',
        mother_weeks: [1, 3, 5, 7],
        father_weeks: [2, 4, 6, 8],
        start_determination: {
          condition: 'last_day_is_friday',
          start_time_if_friday: 'school_pickup',
          start_time_otherwise: 'friday_4pm',
        },
        exchange_rules: {
          day: 'friday',
          time: 'camp_pickup',
          alternate_time_no_camp: '16:00',
          location_type: 'camp',
        },
        transition_to_school_year: {
          method: 'weekend_determination',
          description:
            'On 4pm on the Friday at the conclusion of Father\'s 8th week, return to regular school year schedule based on weekend count (1st, 3rd, 5th = Mother; 2nd, 4th = Father)',
        },
      } as SummerScheduleRuleData,
      conditions: {
        season: 'summer',
        applies_to_children: 'all',
      },
      actions: {
        custodial_parent: CustodialParent.MOTHER, // alternates
        start_time: '16:00',
        end_time: '16:00',
      },
      source_document: this.sourceDocument,
      source_page: 3,
      source_section: '14.a-f',
      extracted_text:
        'For the first eight weeks of the children\'s summer vacation, the parents shall share parenting time on a week on/week off schedule. Mother shall always have the 1st, 3rd, 5th, and 7th weeks of summer, and Father shall always have the 2nd, 4th, 6th, and 8th weeks of summer.',
      effective_from: this.courtOrderDate,
    });

    return rules;
  }

  /**
   * Extract Holiday/School Break Parenting Time Schedule
   * Source: Page 4-5, Section 16
   */
  private extractHolidayRules(): ExtractedRule[] {
    const rules: ExtractedRule[] = [];

    // Halloween
    rules.push({
      rule_type: RuleType.HOLIDAY,
      rule_name: 'Halloween',
      rule_category: RuleCategory.PHYSICAL_CUSTODY,
      priority: 10, // Holidays override regular schedule
      rule_data: {
        type: 'holiday',
        holiday_name: 'Halloween',
        year_pattern: 'odd',
        custodial_parent_odd: CustodialParent.MOTHER,
        custodial_parent_even: CustodialParent.FATHER,
        split_holiday: false,
        date_determination: {
          method: 'fixed_date',
          fixed_date: '10-31',
        },
      } as HolidayRuleData,
      conditions: {
        year_type: 'odd',
        month: 10,
        day_of_month: 31,
      },
      actions: {
        custodial_parent: CustodialParent.MOTHER,
        start_time: '00:00',
        end_time: '23:59',
      },
      source_document: this.sourceDocument,
      source_page: 4,
      source_section: '16.a',
      extracted_text: 'Halloween: with Mother in odd years and Father in even.',
      effective_from: this.courtOrderDate,
    });

    // Thanksgiving
    rules.push({
      rule_type: RuleType.HOLIDAY,
      rule_name: 'Thanksgiving Break',
      rule_category: RuleCategory.PHYSICAL_CUSTODY,
      priority: 10,
      rule_data: {
        type: 'holiday',
        holiday_name: 'Thanksgiving',
        year_pattern: 'odd',
        split_holiday: true,
        split_details: {
          first_half_parent_odd: CustodialParent.FATHER,
          first_half_parent_even: CustodialParent.MOTHER,
          split_datetime: 'noon_wednesday_before_thanksgiving',
        },
        date_determination: {
          method: 'relative_date',
          relative_date: {
            base: 'thanksgiving',
            offset_days: 0,
          },
        },
        exchange_time: {
          start: 'school_pickup_before_break',
          end: 'school_dropoff_after_break',
        },
      } as HolidayRuleData,
      conditions: {
        year_type: 'odd',
      },
      actions: {
        custodial_parent: CustodialParent.FATHER, // first half in odd years
        start_time: 'school_pickup',
        end_time: '12:00',
      },
      source_document: this.sourceDocument,
      source_page: 4,
      source_section: '16.b',
      extracted_text:
        'Thanksgiving break: To be shared equally, with mid-break exchange at Noon on Wednesday (the day before Thanksgiving). In odd years, Father shall have the first half of the break and Mother shall have the second. In even years, Mother shall have the first half of the break and Father shall have the second.',
      effective_from: this.courtOrderDate,
    });

    // Winter Break 2025 (Specific)
    rules.push({
      rule_type: RuleType.HOLIDAY,
      rule_name: 'Winter Break 2025',
      rule_category: RuleCategory.PHYSICAL_CUSTODY,
      priority: 5, // Specific year override
      rule_data: {
        type: 'holiday',
        holiday_name: 'Winter Break 2025',
        year_pattern: 'all',
        split_holiday: true,
        date_determination: {
          method: 'date_range',
          date_range: {
            start: '2025-12-18',
            end: '2026-01-05',
            calculation_method: 'explicit_court_order',
          },
        },
      } as HolidayRuleData,
      conditions: {
        year_type: 'all',
        date_range: {
          start: '2025-12-18',
          end: '2026-01-05',
        },
      },
      actions: {
        custodial_parent: CustodialParent.MOTHER, // first period
        start_time: 'school_pickup',
        end_time: '11:00',
      },
      source_document: this.sourceDocument,
      source_page: 4,
      source_section: '16.c',
      extracted_text:
        'Winter break 2025: With Mother from school pick up 12/18 until 12/22 at 11am; With Father from 12/22 at 11am until 12/25 at 11am; With Mother from 12/25 at 11am to 12/29 at 11am; With Father from 12/29 at 11am to 1/2 at 11am; With Mother from 1/2 at 11am to Monday morning school drop-off on 1/5/26',
      effective_from: '2025-12-18',
      effective_until: '2026-01-05',
    });

    // Winter Break 2026 and Beyond
    rules.push({
      rule_type: RuleType.HOLIDAY,
      rule_name: 'Winter Break (2026+)',
      rule_category: RuleCategory.PHYSICAL_CUSTODY,
      priority: 10,
      rule_data: {
        type: 'holiday',
        holiday_name: 'Winter Break',
        year_pattern: 'odd',
        split_holiday: true,
        split_details: {
          first_half_parent_odd: CustodialParent.FATHER,
          first_half_parent_even: CustodialParent.MOTHER,
          split_datetime: 'midpoint_of_break',
        },
        date_determination: {
          method: 'date_range',
          date_range: {
            start: 'last_day_school_before_break',
            end: 'first_day_school_after_break',
            calculation_method: 'school_calendar',
          },
        },
      } as HolidayRuleData,
      conditions: {
        year_type: 'odd',
      },
      actions: {
        custodial_parent: CustodialParent.FATHER, // first half in odd years
        start_time: 'school_pickup',
        end_time: 'midpoint_11am',
      },
      source_document: this.sourceDocument,
      source_page: 5,
      source_section: '16.d',
      extracted_text:
        'Winter break 2026 and beyond: Winter break is defined as beginning at school pickup on the last day school is in session before the break begins and ending at school drop off on the day that school resumes. The parties shall share the break equally with the mid-break exchange at halfway point of break. In odd years, Father shall have the first half of the break and Mother shall have the second. In even years, Mother shall have the first half of the break and Father shall have the second.',
      effective_from: '2026-01-01',
    });

    // Spring Break
    rules.push({
      rule_type: RuleType.HOLIDAY,
      rule_name: 'Spring Break',
      rule_category: RuleCategory.PHYSICAL_CUSTODY,
      priority: 10,
      rule_data: {
        type: 'holiday',
        holiday_name: 'Spring Break',
        year_pattern: 'odd',
        split_holiday: true,
        split_details: {
          first_half_parent_odd: CustodialParent.FATHER,
          first_half_parent_even: CustodialParent.MOTHER,
          split_datetime: 'midpoint_of_break',
        },
        date_determination: {
          method: 'date_range',
          date_range: {
            start: 'last_day_school_before_break',
            end: 'first_day_school_after_break',
            calculation_method: 'school_calendar',
          },
        },
      } as HolidayRuleData,
      conditions: {
        year_type: 'odd',
      },
      actions: {
        custodial_parent: CustodialParent.FATHER, // first half in odd years
        start_time: 'school_pickup',
        end_time: 'midpoint',
      },
      source_document: this.sourceDocument,
      source_page: 5,
      source_section: '16.e',
      extracted_text:
        'Spring break: Spring break is defined as beginning at school pickup on the last day school is in session before the break begins, and ending at school drop off on the day that school resumes. The parties shall share the break equally with the mid-break exchange at halfway point of break. In odd years, Father shall have the first half of the break and Mother shall have the second. In even years, Mother shall have the first half of the break and Father shall have the second.',
      effective_from: this.courtOrderDate,
    });

    return rules;
  }

  /**
   * Extract Special Day Rules
   * Source: Page 6, Sections 17-19
   */
  private extractSpecialDayRules(): ExtractedRule[] {
    const rules: ExtractedRule[] = [];

    // Mother's Birthday (Alexandra Roberts - Oct 2)
    rules.push({
      rule_type: RuleType.SPECIAL_DAY,
      rule_name: 'Mother\'s Birthday (Alexandra Roberts)',
      rule_category: RuleCategory.PHYSICAL_CUSTODY,
      priority: 5, // Special days override holidays
      rule_data: {
        type: 'special_day',
        occasion: 'mother_birthday',
        custodial_parent: CustodialParent.MOTHER,
        duration_hours: 24,
        start_time: '09:00',
        end_time: 'school_dropoff_next_day',
        date_determination: {
          method: 'fixed_date',
          date: '10-02',
        },
      } as SpecialDayRuleData,
      conditions: {
        month: 10,
        day_of_month: 2,
        applies_to_children: 'all',
      },
      actions: {
        custodial_parent: CustodialParent.MOTHER,
        start_time: '09:00',
        end_time: '09:00', // next day or school dropoff
      },
      source_document: this.sourceDocument,
      source_page: 6,
      source_section: '17',
      extracted_text:
        'Parents\' birthdays: Each parent shall have custody of the children from 9am on their respective birthday until morning school/camp drop-off the following morning (or 9am return to receiving parent\'s home, curbside, if no school/camp).',
      effective_from: this.courtOrderDate,
    });

    // Father's Birthday (Scott Gardenhire - Dec 31)
    rules.push({
      rule_type: RuleType.SPECIAL_DAY,
      rule_name: 'Father\'s Birthday (Scott Gardenhire)',
      rule_category: RuleCategory.PHYSICAL_CUSTODY,
      priority: 5,
      rule_data: {
        type: 'special_day',
        occasion: 'father_birthday',
        custodial_parent: CustodialParent.FATHER,
        duration_hours: 24,
        start_time: '09:00',
        end_time: 'school_dropoff_next_day',
        date_determination: {
          method: 'fixed_date',
          date: '12-31',
        },
      } as SpecialDayRuleData,
      conditions: {
        month: 12,
        day_of_month: 31,
        applies_to_children: 'all',
      },
      actions: {
        custodial_parent: CustodialParent.FATHER,
        start_time: '09:00',
        end_time: '09:00', // next day or school dropoff
      },
      source_document: this.sourceDocument,
      source_page: 6,
      source_section: '17',
      extracted_text:
        'Parents\' birthdays: Each parent shall have custody of the children from 9am on their respective birthday until morning school/camp drop-off the following morning (or 9am return to receiving parent\'s home, curbside, if no school/camp).',
      effective_from: this.courtOrderDate,
    });

    // Mother's Day
    rules.push({
      rule_type: RuleType.SPECIAL_DAY,
      rule_name: 'Mother\'s Day',
      rule_category: RuleCategory.PHYSICAL_CUSTODY,
      priority: 5,
      rule_data: {
        type: 'special_day',
        occasion: 'mothers_day',
        custodial_parent: CustodialParent.MOTHER,
        duration_hours: 24,
        start_time: '09:00',
        end_time: 'school_dropoff_next_day',
        date_determination: {
          method: 'specific_sunday',
          relative: 'second_sunday_may',
        },
      } as SpecialDayRuleData,
      conditions: {
        month: 5,
        applies_to_children: 'all',
      },
      actions: {
        custodial_parent: CustodialParent.MOTHER,
        start_time: '09:00',
        end_time: '09:00',
      },
      source_document: this.sourceDocument,
      source_page: 6,
      source_section: '18',
      extracted_text:
        'Mother\'s Day and Father\'s Day: Each parent shall have custody of the children from 9am on their respective celebration day until morning school/camp drop-off the following morning (or 9am return to receiving parent\'s home, curbside, if no school/camp).',
      effective_from: this.courtOrderDate,
    });

    // Father's Day
    rules.push({
      rule_type: RuleType.SPECIAL_DAY,
      rule_name: 'Father\'s Day',
      rule_category: RuleCategory.PHYSICAL_CUSTODY,
      priority: 5,
      rule_data: {
        type: 'special_day',
        occasion: 'fathers_day',
        custodial_parent: CustodialParent.FATHER,
        duration_hours: 24,
        start_time: '09:00',
        end_time: 'school_dropoff_next_day',
        date_determination: {
          method: 'specific_sunday',
          relative: 'third_sunday_june',
        },
      } as SpecialDayRuleData,
      conditions: {
        month: 6,
        applies_to_children: 'all',
      },
      actions: {
        custodial_parent: CustodialParent.FATHER,
        start_time: '09:00',
        end_time: '09:00',
      },
      source_document: this.sourceDocument,
      source_page: 6,
      source_section: '18',
      extracted_text:
        'Mother\'s Day and Father\'s Day: Each parent shall have custody of the children from 9am on their respective celebration day until morning school/camp drop-off the following morning (or 9am return to receiving parent\'s home, curbside, if no school/camp).',
      effective_from: this.courtOrderDate,
    });

    return rules;
  }

  /**
   * Extract Travel Provisions
   * Source: Page 6, Section 20
   */
  private extractTravelRules(): ExtractedRule[] {
    const rules: ExtractedRule[] = [];

    // Domestic Travel
    rules.push({
      rule_type: RuleType.TRAVEL,
      rule_name: 'Domestic Travel',
      rule_category: RuleCategory.TRAVEL,
      priority: 200,
      rule_data: {
        type: 'travel',
        travel_type: 'domestic',
        requires_consent: false,
        notice_period_days: 30,
        required_information: [
          'destination',
          'lodging_locations',
          'dates_of_travel',
          'flight_information_if_air',
          'emergency_contact_if_no_cell',
        ],
      } as TravelRuleData,
      conditions: {
        applies_to_children: 'all',
      },
      actions: {
        custodial_parent: CustodialParent.MOTHER, // applies to both
        start_time: '',
        end_time: '',
      },
      source_document: this.sourceDocument,
      source_page: 6,
      source_section: '20.a',
      extracted_text:
        'Domestic travel does not require the consent of the other parent. However if a parent will be travelling with the children overnight away from home, the travelling parent shall provide the other parent with at least 30 days written notice to the other parent with the basic information of the travel (destination and lodging locations, dates of travel (and flight information if travelling by air), and emergency contact information if cell service not available).',
      effective_from: this.courtOrderDate,
    });

    // International Travel
    rules.push({
      rule_type: RuleType.TRAVEL,
      rule_name: 'International Travel',
      rule_category: RuleCategory.TRAVEL,
      priority: 200,
      rule_data: {
        type: 'travel',
        travel_type: 'international',
        requires_consent: true,
        notice_period_days: 60,
        required_information: [
          'destination',
          'lodging_locations',
          'dates_of_travel',
          'flight_information_if_air',
          'emergency_contact_if_no_cell',
        ],
        consent_rules: {
          cannot_unreasonably_withhold: true,
          document_requirements: [
            'written_permission_or_court_order',
            'travel_documents',
          ],
          document_delivery_days_before: 10,
        },
      } as TravelRuleData,
      conditions: {
        applies_to_children: 'all',
      },
      actions: {
        custodial_parent: CustodialParent.MOTHER, // applies to both
        start_time: '',
        end_time: '',
      },
      source_document: this.sourceDocument,
      source_page: 6,
      source_section: '20.b',
      extracted_text:
        'For international travel, either written permission from the other parent (confirmation via email is acceptable) or a Court order is required. The parent seeking to travel internationally shall provide at least 60 days written notice to the other parent with the basic information of the travel (destination and lodging locations, dates of travel (and flight information if travelling by air), and emergency contact information if cell service not available). Consent for international travel shall not be unreasonably withheld. The travelling parent shall be provided with any necessary travel documents and/or written travel authorization no less than 10 days before the planned travel.',
      effective_from: this.courtOrderDate,
    });

    return rules;
  }

  /**
   * Extract Right of First Refusal
   * Source: Page 6, Section 21
   */
  private extractRightOfFirstRefusalRule(): ExtractedRule {
    return {
      rule_type: RuleType.RIGHT_OF_FIRST_REFUSAL,
      rule_name: 'Right of First Refusal',
      rule_category: RuleCategory.PHYSICAL_CUSTODY,
      priority: 50,
      rule_data: {
        type: 'right_of_first_refusal',
        threshold: {
          duration: 1,
          unit: 'overnights',
          operator: 'more_than',
        },
        notification_period_hours: 24, // implied from response time
        response_period_hours: 24,
        applies_to: 'both',
      } as RightOfFirstRefusalRuleData,
      conditions: {
        applies_to_children: 'all',
      },
      actions: {
        custodial_parent: CustodialParent.MOTHER, // applies to both
        start_time: '',
        end_time: '',
      },
      source_document: this.sourceDocument,
      source_page: 6,
      source_section: '21',
      extracted_text:
        'Right of First Refusal: If a parent will themselves be unable to care for the children for a period of more than one overnight during their scheduled custodial time, they shall advise the other parent of their upcoming unavailability and ask the other parent if they are able to care for the children. The other parent shall have 24 hours to respond to accept or decline care during the identified dates. If no response is given or the other parent is not available to care for the children, then the regularly scheduled custodial parent is responsible for securing childcare.',
      effective_from: this.courtOrderDate,
    };
  }

  /**
   * Extract Childcare Rules
   * Source: Page 7, Section 22
   */
  private extractChildcareRule(): ExtractedRule {
    return {
      rule_type: RuleType.CHILDCARE,
      rule_name: 'Childcare Providers',
      rule_category: RuleCategory.OTHER,
      priority: 200,
      rule_data: {
        type: 'childcare',
        notification_required: true,
        allowed_providers: [
          {
            type: 'specific_person',
            name: 'Finn',
            age_requirement: 15,
            max_hours_per_session: 3,
            max_sessions_per_week: 2,
            location_restriction: 'fathers_home_only',
          },
          {
            type: 'third_party',
            age_requirement: 18,
          },
        ],
        information_sharing_requirement:
          'name_and_contact_info_to_non_custodial_parent',
      } as ChildcareRuleData,
      conditions: {
        applies_to_children: 'all',
      },
      actions: {
        custodial_parent: CustodialParent.MOTHER, // applies to both
        start_time: '',
        end_time: '',
      },
      source_document: this.sourceDocument,
      source_page: 7,
      source_section: '22',
      extracted_text:
        'Childcare: The custodial parent must ensure that the non-custodial parent has the name and contact information for any childcare provider, including 15 year old Finn. Finn may care for the children for periods of 3 hours or less, no more than 2x weekly, with childcare to occur only at Father\'s home. Any third party childcare providers must be over 18 and name and contact information must be provided to the non-custodial parent.',
      effective_from: this.courtOrderDate,
    };
  }

  /**
   * Extract Exchange Protocol
   * Source: Page 3, Section 12.e-f
   */
  private extractExchangeProtocolRule(): ExtractedRule {
    return {
      rule_type: RuleType.EXCHANGE_PROTOCOL,
      rule_name: 'Exchange Protocol',
      rule_category: RuleCategory.PHYSICAL_CUSTODY,
      priority: 150,
      rule_data: {
        type: 'exchange_protocol',
        interaction_rules: {
          duration: 'brief',
          demeanor: 'polite',
        },
        third_party_restriction: {
          allowed: false,
          requires_written_agreement: true,
        },
        modification_allowed: {
          requires_written_agreement: true,
        },
      },
      conditions: {
        applies_to_children: 'all',
      },
      actions: {
        custodial_parent: CustodialParent.MOTHER, // applies to both
        start_time: '',
        end_time: '',
      },
      source_document: this.sourceDocument,
      source_page: 3,
      source_section: '12.e-g',
      extracted_text:
        'During exchanges the parents shall have only brief and polite interactions. Until and unless the parties agree otherwise in writing, no third parties shall be allowed at custodial exchanges. The parties may agree to modify the regular schedule through mutual written agreement.',
      effective_from: this.courtOrderDate,
    };
  }
}

/**
 * Export a singleton instance
 */
export const ruleExtractor = new RuleExtractor();
