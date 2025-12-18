-- ============================================================================
-- SEED DATA: Roberts v. Gardenhire (FPT-25-378556)
-- Custody calendar application - Court order dated September 30, 2025
-- ============================================================================

-- Insert custody case
INSERT INTO custody_cases (
    id,
    case_number,
    court_name,
    county,
    state,
    hearing_date,
    presiding_judge,
    department,
    case_status,
    mother_first_name,
    mother_middle_name,
    mother_last_name,
    mother_dob,
    father_first_name,
    father_middle_name,
    father_last_name,
    father_dob,
    children,
    created_by
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'FPT-25-378556',
    'Superior Court of California',
    'San Francisco',
    'CA',
    '2025-09-30',
    'ANNE COSTIN',
    '404',
    'active',
    'Alexandra',
    'Eleanore',
    'Roberts',
    '1992-10-02', -- Mother DOB: Oct 2
    'Scott',
    'James',
    'Gardenhire',
    '1989-12-31', -- Father DOB: Dec 31
    '[
        {
            "first_name": "Basil",
            "last_name": "Roberts-Gardenhire",
            "dob": "2017-09-10",
            "age": 8
        },
        {
            "first_name": "Alfred",
            "last_name": "Roberts-Gardenhire",
            "nickname": "Alfie",
            "dob": "2020-04-10",
            "age": 5
        }
    ]'::jsonb,
    'system_seed'
);

-- ============================================================================
-- REGULAR SCHEDULE RULES
-- ============================================================================

-- Rule 1: Mother - Thursday Overnight (Every Week)
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'regular_schedule',
    'Mother - Thursday Overnight (Every Week)',
    'physical_custody',
    100,
    '{
        "type": "regular_schedule",
        "schedule": {
            "weekday_periods": [
                {
                    "day": "thursday",
                    "start_time": "school_pickup",
                    "end_time": "friday_school_dropoff",
                    "custodial_parent": "mother"
                }
            ]
        },
        "exchange_rules": {
            "location_type": "school",
            "protocol": "brief_and_polite"
        }
    }'::jsonb,
    '{
        "season": "school_year",
        "school_in_session": true,
        "applies_to_children": "all"
    }'::jsonb,
    '{
        "custodial_parent": "mother",
        "start_time": "school_pickup",
        "end_time": "school_dropoff"
    }'::jsonb,
    'RobertsTR.pdf',
    3,
    '12.a',
    'With Mother every week from Thursday afternoon school pickup to Friday morning school drop-off.',
    '2025-09-30',
    true,
    'system_seed'
);

-- Rule 2: Mother - Alternating Weekends
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'regular_schedule',
    'Mother - Alternating Weekends',
    'physical_custody',
    100,
    '{
        "type": "regular_schedule",
        "schedule": {
            "weekend_periods": [
                {
                    "frequency": "alternating",
                    "start_day": "friday",
                    "start_time": "school_pickup",
                    "end_day": "monday",
                    "end_time": "school_dropoff",
                    "custodial_parent": "mother"
                }
            ]
        },
        "exchange_rules": {
            "location_type": "school",
            "protocol": "brief_and_polite"
        },
        "school_holiday_extension": {
            "extends_to": "tuesday_morning",
            "applies_when": "monday_is_holiday"
        }
    }'::jsonb,
    '{
        "season": "school_year",
        "school_in_session": true,
        "applies_to_children": "all"
    }'::jsonb,
    '{
        "custodial_parent": "mother",
        "start_time": "school_pickup",
        "end_time": "school_dropoff"
    }'::jsonb,
    'RobertsTR.pdf',
    3,
    '12.b, 12.d',
    'With Mother every other (alternating) weekends from Friday afternoon school pickup to Monday morning school drop-off. If a Monday is a school holiday, the custodial parent''s time shall extend until Tuesday morning school drop-off.',
    '2025-09-30',
    true,
    'system_seed'
);

-- ============================================================================
-- SUMMER SCHEDULE RULE
-- ============================================================================

INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'summer_schedule',
    'Summer - 8 Week Rotation (Week On/Week Off)',
    'physical_custody',
    90,
    '{
        "type": "summer_schedule",
        "duration_weeks": 8,
        "schedule_pattern": "week_on_week_off",
        "mother_weeks": [1, 3, 5, 7],
        "father_weeks": [2, 4, 6, 8],
        "start_determination": {
            "condition": "last_day_is_friday",
            "start_time_if_friday": "school_pickup",
            "start_time_otherwise": "friday_4pm"
        },
        "exchange_rules": {
            "day": "friday",
            "time": "camp_pickup",
            "alternate_time_no_camp": "16:00",
            "location_type": "camp"
        },
        "transition_to_school_year": {
            "method": "weekend_determination",
            "description": "On 4pm on the Friday at the conclusion of Father''s 8th week, return to regular school year schedule based on weekend count"
        }
    }'::jsonb,
    '{
        "season": "summer",
        "applies_to_children": "all"
    }'::jsonb,
    '{
        "custodial_parent": "mother",
        "start_time": "16:00",
        "end_time": "16:00"
    }'::jsonb,
    'RobertsTR.pdf',
    3,
    '14.a-f',
    'For the first eight weeks of the children''s summer vacation, the parents shall share parenting time on a week on/week off schedule. Mother shall always have the 1st, 3rd, 5th, and 7th weeks of summer, and Father shall always have the 2nd, 4th, 6th, and 8th weeks of summer.',
    '2025-09-30',
    true,
    'system_seed'
);

-- ============================================================================
-- HOLIDAY RULES
-- ============================================================================

-- Halloween
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'holiday',
    'Halloween',
    'physical_custody',
    10,
    '{
        "type": "holiday",
        "holiday_name": "Halloween",
        "year_pattern": "odd",
        "custodial_parent_odd": "mother",
        "custodial_parent_even": "father",
        "split_holiday": false,
        "date_determination": {
            "method": "fixed_date",
            "fixed_date": "10-31"
        }
    }'::jsonb,
    '{
        "year_type": "odd",
        "month": 10,
        "day_of_month": 31
    }'::jsonb,
    '{
        "custodial_parent": "mother",
        "start_time": "00:00",
        "end_time": "23:59"
    }'::jsonb,
    'RobertsTR.pdf',
    4,
    '16.a',
    'Halloween: with Mother in odd years and Father in even.',
    '2025-09-30',
    true,
    'system_seed'
);

-- Thanksgiving Break
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'holiday',
    'Thanksgiving Break',
    'physical_custody',
    10,
    '{
        "type": "holiday",
        "holiday_name": "Thanksgiving",
        "year_pattern": "odd",
        "split_holiday": true,
        "split_details": {
            "first_half_parent_odd": "father",
            "first_half_parent_even": "mother",
            "split_datetime": "noon_wednesday_before_thanksgiving"
        },
        "date_determination": {
            "method": "relative_date",
            "relative_date": {
                "base": "thanksgiving",
                "offset_days": 0
            }
        }
    }'::jsonb,
    '{
        "year_type": "odd"
    }'::jsonb,
    '{
        "custodial_parent": "father",
        "start_time": "school_pickup",
        "end_time": "12:00"
    }'::jsonb,
    'RobertsTR.pdf',
    4,
    '16.b',
    'Thanksgiving break: To be shared equally, with mid-break exchange at Noon on Wednesday (the day before Thanksgiving). In odd years, Father shall have the first half of the break and Mother shall have the second. In even years, Mother shall have the first half of the break and Father shall have the second.',
    '2025-09-30',
    true,
    'system_seed'
);

-- Winter Break 2025 (Specific)
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    effective_until,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'holiday',
    'Winter Break 2025',
    'physical_custody',
    5,
    '{
        "type": "holiday",
        "holiday_name": "Winter Break 2025",
        "year_pattern": "all",
        "split_holiday": true,
        "date_determination": {
            "method": "date_range",
            "date_range": {
                "start": "2025-12-18",
                "end": "2026-01-05",
                "calculation_method": "explicit_court_order"
            }
        }
    }'::jsonb,
    '{
        "year_type": "all",
        "date_range": {
            "start": "2025-12-18",
            "end": "2026-01-05"
        }
    }'::jsonb,
    '{
        "custodial_parent": "mother",
        "start_time": "school_pickup",
        "end_time": "11:00"
    }'::jsonb,
    'RobertsTR.pdf',
    4,
    '16.c',
    'Winter break 2025: With Mother from school pick up 12/18 until 12/22 at 11am; With Father from 12/22 at 11am until 12/25 at 11am; With Mother from 12/25 at 11am to 12/29 at 11am; With Father from 12/29 at 11am to 1/2 at 11am; With Mother from 1/2 at 11am to Monday morning school drop-off on 1/5/26',
    '2025-12-18',
    '2026-01-05',
    true,
    'system_seed'
);

-- Winter Break 2026+
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'holiday',
    'Winter Break (2026+)',
    'physical_custody',
    10,
    '{
        "type": "holiday",
        "holiday_name": "Winter Break",
        "year_pattern": "odd",
        "split_holiday": true,
        "split_details": {
            "first_half_parent_odd": "father",
            "first_half_parent_even": "mother",
            "split_datetime": "midpoint_of_break"
        },
        "date_determination": {
            "method": "date_range",
            "date_range": {
                "start": "last_day_school_before_break",
                "end": "first_day_school_after_break",
                "calculation_method": "school_calendar"
            }
        }
    }'::jsonb,
    '{
        "year_type": "odd"
    }'::jsonb,
    '{
        "custodial_parent": "father",
        "start_time": "school_pickup",
        "end_time": "midpoint_11am"
    }'::jsonb,
    'RobertsTR.pdf',
    5,
    '16.d',
    'Winter break 2026 and beyond: Winter break is defined as beginning at school pickup on the last day school is in session before the break begins and ending at school drop off on the day that school resumes. The parties shall share the break equally with the mid-break exchange at halfway point of break.',
    '2026-01-01',
    true,
    'system_seed'
);

-- Spring Break
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000008'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'holiday',
    'Spring Break',
    'physical_custody',
    10,
    '{
        "type": "holiday",
        "holiday_name": "Spring Break",
        "year_pattern": "odd",
        "split_holiday": true,
        "split_details": {
            "first_half_parent_odd": "father",
            "first_half_parent_even": "mother",
            "split_datetime": "midpoint_of_break"
        },
        "date_determination": {
            "method": "date_range",
            "date_range": {
                "start": "last_day_school_before_break",
                "end": "first_day_school_after_break",
                "calculation_method": "school_calendar"
            }
        }
    }'::jsonb,
    '{
        "year_type": "odd"
    }'::jsonb,
    '{
        "custodial_parent": "father",
        "start_time": "school_pickup",
        "end_time": "midpoint"
    }'::jsonb,
    'RobertsTR.pdf',
    5,
    '16.e',
    'Spring break: Spring break is defined as beginning at school pickup on the last day school is in session before the break begins, and ending at school drop off on the day that school resumes. The parties shall share the break equally with the mid-break exchange at halfway point of break.',
    '2025-09-30',
    true,
    'system_seed'
);

-- ============================================================================
-- SPECIAL DAY RULES
-- ============================================================================

-- Mother's Birthday
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000009'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'special_day',
    'Mother''s Birthday (Alexandra Roberts)',
    'physical_custody',
    5,
    '{
        "type": "special_day",
        "occasion": "mother_birthday",
        "custodial_parent": "mother",
        "duration_hours": 24,
        "start_time": "09:00",
        "end_time": "school_dropoff_next_day",
        "date_determination": {
            "method": "fixed_date",
            "date": "10-02"
        }
    }'::jsonb,
    '{
        "month": 10,
        "day_of_month": 2,
        "applies_to_children": "all"
    }'::jsonb,
    '{
        "custodial_parent": "mother",
        "start_time": "09:00",
        "end_time": "09:00"
    }'::jsonb,
    'RobertsTR.pdf',
    6,
    '17',
    'Parents'' birthdays: Each parent shall have custody of the children from 9am on their respective birthday until morning school/camp drop-off the following morning (or 9am return to receiving parent''s home, curbside, if no school/camp).',
    '2025-09-30',
    true,
    'system_seed'
);

-- Father's Birthday
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000010'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'special_day',
    'Father''s Birthday (Scott Gardenhire)',
    'physical_custody',
    5,
    '{
        "type": "special_day",
        "occasion": "father_birthday",
        "custodial_parent": "father",
        "duration_hours": 24,
        "start_time": "09:00",
        "end_time": "school_dropoff_next_day",
        "date_determination": {
            "method": "fixed_date",
            "date": "12-31"
        }
    }'::jsonb,
    '{
        "month": 12,
        "day_of_month": 31,
        "applies_to_children": "all"
    }'::jsonb,
    '{
        "custodial_parent": "father",
        "start_time": "09:00",
        "end_time": "09:00"
    }'::jsonb,
    'RobertsTR.pdf',
    6,
    '17',
    'Parents'' birthdays: Each parent shall have custody of the children from 9am on their respective birthday until morning school/camp drop-off the following morning (or 9am return to receiving parent''s home, curbside, if no school/camp).',
    '2025-09-30',
    true,
    'system_seed'
);

-- Mother's Day
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'special_day',
    'Mother''s Day',
    'physical_custody',
    5,
    '{
        "type": "special_day",
        "occasion": "mothers_day",
        "custodial_parent": "mother",
        "duration_hours": 24,
        "start_time": "09:00",
        "end_time": "school_dropoff_next_day",
        "date_determination": {
            "method": "specific_sunday",
            "relative": "second_sunday_may"
        }
    }'::jsonb,
    '{
        "month": 5,
        "applies_to_children": "all"
    }'::jsonb,
    '{
        "custodial_parent": "mother",
        "start_time": "09:00",
        "end_time": "09:00"
    }'::jsonb,
    'RobertsTR.pdf',
    6,
    '18',
    'Mother''s Day and Father''s Day: Each parent shall have custody of the children from 9am on their respective celebration day until morning school/camp drop-off the following morning (or 9am return to receiving parent''s home, curbside, if no school/camp).',
    '2025-09-30',
    true,
    'system_seed'
);

-- Father's Day
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000012'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'special_day',
    'Father''s Day',
    'physical_custody',
    5,
    '{
        "type": "special_day",
        "occasion": "fathers_day",
        "custodial_parent": "father",
        "duration_hours": 24,
        "start_time": "09:00",
        "end_time": "school_dropoff_next_day",
        "date_determination": {
            "method": "specific_sunday",
            "relative": "third_sunday_june"
        }
    }'::jsonb,
    '{
        "month": 6,
        "applies_to_children": "all"
    }'::jsonb,
    '{
        "custodial_parent": "father",
        "start_time": "09:00",
        "end_time": "09:00"
    }'::jsonb,
    'RobertsTR.pdf',
    6,
    '18',
    'Mother''s Day and Father''s Day: Each parent shall have custody of the children from 9am on their respective celebration day until morning school/camp drop-off the following morning (or 9am return to receiving parent''s home, curbside, if no school/camp).',
    '2025-09-30',
    true,
    'system_seed'
);

-- ============================================================================
-- TRAVEL RULES
-- ============================================================================

-- Domestic Travel
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000013'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'travel',
    'Domestic Travel',
    'travel',
    200,
    '{
        "type": "travel",
        "travel_type": "domestic",
        "requires_consent": false,
        "notice_period_days": 30,
        "required_information": [
            "destination",
            "lodging_locations",
            "dates_of_travel",
            "flight_information_if_air",
            "emergency_contact_if_no_cell"
        ]
    }'::jsonb,
    '{
        "applies_to_children": "all"
    }'::jsonb,
    '{
        "custodial_parent": "mother",
        "start_time": "",
        "end_time": ""
    }'::jsonb,
    'RobertsTR.pdf',
    6,
    '20.a',
    'Domestic travel does not require the consent of the other parent. However if a parent will be travelling with the children overnight away from home, the travelling parent shall provide the other parent with at least 30 days written notice.',
    '2025-09-30',
    true,
    'system_seed'
);

-- International Travel
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000014'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'travel',
    'International Travel',
    'travel',
    200,
    '{
        "type": "travel",
        "travel_type": "international",
        "requires_consent": true,
        "notice_period_days": 60,
        "required_information": [
            "destination",
            "lodging_locations",
            "dates_of_travel",
            "flight_information_if_air",
            "emergency_contact_if_no_cell"
        ],
        "consent_rules": {
            "cannot_unreasonably_withhold": true,
            "document_requirements": [
                "written_permission_or_court_order",
                "travel_documents"
            ],
            "document_delivery_days_before": 10
        }
    }'::jsonb,
    '{
        "applies_to_children": "all"
    }'::jsonb,
    '{
        "custodial_parent": "mother",
        "start_time": "",
        "end_time": ""
    }'::jsonb,
    'RobertsTR.pdf',
    6,
    '20.b',
    'For international travel, either written permission from the other parent (confirmation via email is acceptable) or a Court order is required. The parent seeking to travel internationally shall provide at least 60 days written notice.',
    '2025-09-30',
    true,
    'system_seed'
);

-- ============================================================================
-- OTHER RULES
-- ============================================================================

-- Right of First Refusal
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000015'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'right_of_first_refusal',
    'Right of First Refusal',
    'physical_custody',
    50,
    '{
        "type": "right_of_first_refusal",
        "threshold": {
            "duration": 1,
            "unit": "overnights",
            "operator": "more_than"
        },
        "notification_period_hours": 24,
        "response_period_hours": 24,
        "applies_to": "both"
    }'::jsonb,
    '{
        "applies_to_children": "all"
    }'::jsonb,
    '{
        "custodial_parent": "mother",
        "start_time": "",
        "end_time": ""
    }'::jsonb,
    'RobertsTR.pdf',
    6,
    '21',
    'Right of First Refusal: If a parent will themselves be unable to care for the children for a period of more than one overnight during their scheduled custodial time, they shall advise the other parent.',
    '2025-09-30',
    true,
    'system_seed'
);

-- Childcare
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000016'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'childcare',
    'Childcare Providers',
    'other',
    200,
    '{
        "type": "childcare",
        "notification_required": true,
        "allowed_providers": [
            {
                "type": "specific_person",
                "name": "Finn",
                "age_requirement": 15,
                "max_hours_per_session": 3,
                "max_sessions_per_week": 2,
                "location_restriction": "fathers_home_only"
            },
            {
                "type": "third_party",
                "age_requirement": 18
            }
        ],
        "information_sharing_requirement": "name_and_contact_info_to_non_custodial_parent"
    }'::jsonb,
    '{
        "applies_to_children": "all"
    }'::jsonb,
    '{
        "custodial_parent": "mother",
        "start_time": "",
        "end_time": ""
    }'::jsonb,
    'RobertsTR.pdf',
    7,
    '22',
    'Childcare: The custodial parent must ensure that the non-custodial parent has the name and contact information for any childcare provider, including 15 year old Finn.',
    '2025-09-30',
    true,
    'system_seed'
);

-- Exchange Protocol
INSERT INTO custody_rules (
    id,
    case_id,
    rule_type,
    rule_name,
    rule_category,
    priority,
    rule_data,
    conditions,
    actions,
    source_document,
    source_page,
    source_section,
    extracted_text,
    effective_from,
    is_validated,
    created_by
) VALUES (
    '00000000-0000-0000-0001-000000000017'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'exchange_protocol',
    'Exchange Protocol',
    'physical_custody',
    150,
    '{
        "type": "exchange_protocol",
        "interaction_rules": {
            "duration": "brief",
            "demeanor": "polite"
        },
        "third_party_restriction": {
            "allowed": false,
            "requires_written_agreement": true
        },
        "modification_allowed": {
            "requires_written_agreement": true
        }
    }'::jsonb,
    '{
        "applies_to_children": "all"
    }'::jsonb,
    '{
        "custodial_parent": "mother",
        "start_time": "",
        "end_time": ""
    }'::jsonb,
    'RobertsTR.pdf',
    3,
    '12.e-g',
    'During exchanges the parents shall have only brief and polite interactions. Until and unless the parties agree otherwise in writing, no third parties shall be allowed at custodial exchanges.',
    '2025-09-30',
    true,
    'system_seed'
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count rules by type
SELECT rule_type, COUNT(*) as count
FROM custody_rules
WHERE case_id = '00000000-0000-0000-0000-000000000001'::uuid
GROUP BY rule_type
ORDER BY rule_type;

-- Verify all rules are validated
SELECT
    rule_name,
    is_validated,
    effective_from,
    effective_until
FROM custody_rules
WHERE case_id = '00000000-0000-0000-0000-000000000001'::uuid
ORDER BY priority, rule_name;
