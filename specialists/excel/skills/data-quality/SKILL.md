# Excel data quality

**Use for:** duplicates, missing values, validation, reconciliation and cleanup.

1. Inspect actual headers and data boundaries.
2. Confirm required columns, key semantics, accepted values and date rules rather than guessing.
3. Run read-only checks first: missing headers, blanks, duplicate keys, types, ranges, category consistency and date anomalies.
4. Report counts and safe row references; avoid exposing unnecessary personal/confidential values.
5. Propose corrections. Do not delete, normalize or deduplicate source data without explicit approval.
6. For approved changes, use a copy and report before/after.

**Output:** issue register with rule, affected count, example/reference, severity and proposed correction. Repeated values are not necessarily duplicate business records.
