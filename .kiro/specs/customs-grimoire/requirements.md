# Requirements Document

## Introduction

PhantasmTrack (GrimCourier) is a gothic dark-fantasy grimoire for tracking cross-border packages ("Quests"). This specification defines the core business logic for three capability areas: the Alchemist Customs Calculator (which applies Ecuador's 4x4 simplified import regime or the general import regime), the Annual Mana Bars (which track cumulative annual weight and import budget usage against limits), and the Quest Tracker (which manages packages across arcane delivery stages).

The pure business logic for tax calculation, weight validation, and mana bar percentages is specified independently of any UI concern so it can later be isolated in `src/domain/customs/` and verified with Property-Based Testing (Vitest + fast-check). All monetary values are expressed in United States Dollars (USD). All weights are expressed in kilograms (kg).

## Glossary

- **Customs_Calculator**: The pure domain component that determines the applicable import regime and computes taxes and fees for a single package.
- **Mana_Bar_Tracker**: The pure domain component that computes cumulative annual usage and threshold status for the annual weight limit and the annual import budget limit.
- **Quest_Tracker**: The domain component that manages the lifecycle stage of each package (Quest).
- **Quest**: A single cross-border package tracked by the system.
- **FOB_Value**: The Free On Board declared value of a package, expressed in USD.
- **Package_Weight**: The weight of a package, expressed in kg.
- **Four_By_Four_Regime**: The Ecuador simplified import regime that applies when a package weighs no more than 4 kg and has an FOB_Value no greater than 400 USD. Under this regime the ad-valorem tariff is 0 USD and the VAT rate is 0 percent; only a flat courier/customs fee applies.
- **General_Import_Regime**: The import regime that applies when a package exceeds either the weight limit or the FOB_Value limit of the Four_By_Four_Regime. Under this regime an ad-valorem tariff and VAT are assessed.
- **Weight_Limit**: The Four_By_Four_Regime maximum package weight of 4 kg.
- **FOB_Limit**: The Four_By_Four_Regime maximum package FOB_Value of 400 USD.
- **Ad_Valorem_Tariff**: A tariff computed as a percentage of the FOB_Value under the General_Import_Regime.
- **VAT**: Value Added Tax, computed as a percentage of a defined taxable base under the General_Import_Regime.
- **Flat_Fee**: The fixed courier/customs fee applied to every package regardless of regime.
- **Tax_Result**: The deterministic output of the Customs_Calculator for a single package, containing the applied regime, the ad-valorem tariff amount, the VAT amount, the flat fee amount, and the total amount due.
- **Annual_Weight_Limit**: The configured maximum cumulative Package_Weight allowed per year, expressed in kg.
- **Annual_Budget_Limit**: The configured maximum cumulative FOB_Value allowed per year, expressed in USD.
- **Usage_Percentage**: The cumulative consumed amount divided by its configured limit, expressed as a percentage.
- **Warning_Threshold**: The Usage_Percentage value of 80 percent at which a non-critical warning status is raised.
- **Critical_Threshold**: The Usage_Percentage value of 100 percent at which a limit-reached status is raised.
- **Quest_Stage**: The current lifecycle stage of a Quest, one of Origin Portal, Customs Abyss, or Guild Delivery.
- **Origin_Portal**: The initial Quest_Stage representing the origin warehouse.
- **Customs_Abyss**: The Quest_Stage representing customs processing.
- **Guild_Delivery**: The Quest_Stage representing local guild (final) delivery.

## Requirements

### Requirement 1: Determine applicable import regime

**User Story:** As a cross-border shopper, I want the grimoire to determine which customs regime applies to a package, so that I know whether my package qualifies for the simplified 4x4 regime.

#### Acceptance Criteria

1. WHEN a package with a Package_Weight no greater than the Weight_Limit AND an FOB_Value no greater than the FOB_Limit is evaluated, THE Customs_Calculator SHALL select the Four_By_Four_Regime.
2. WHEN a package with a Package_Weight greater than the Weight_Limit is evaluated, THE Customs_Calculator SHALL select the General_Import_Regime regardless of the package's FOB_Value.
3. WHEN a package with an FOB_Value greater than the FOB_Limit is evaluated, THE Customs_Calculator SHALL select the General_Import_Regime regardless of the package's Package_Weight.
4. WHEN a package is evaluated, THE Customs_Calculator SHALL select exactly one of the Four_By_Four_Regime or the General_Import_Regime and include the selected regime in the Tax_Result.
5. IF a package is evaluated without both a defined Package_Weight and a defined FOB_Value, THEN THE Customs_Calculator SHALL select no regime and return a validation error identifying the missing field, while retaining any previously provided input unchanged.

### Requirement 2: Compute taxes and fees under the 4x4 regime

**User Story:** As a cross-border shopper, I want the grimoire to compute the cost of a qualifying package, so that I know only the flat fee applies.

#### Acceptance Criteria

1. WHEN the Customs_Calculator selects the Four_By_Four_Regime for a package, THE Customs_Calculator SHALL set the Ad_Valorem_Tariff amount to exactly 0 USD in the Tax_Result.
2. WHEN the Customs_Calculator selects the Four_By_Four_Regime for a package, THE Customs_Calculator SHALL set the VAT amount to exactly 0 USD in the Tax_Result.
3. WHEN the Customs_Calculator selects the Four_By_Four_Regime for a package, THE Customs_Calculator SHALL set the Flat_Fee amount in the Tax_Result equal to the configured Flat_Fee, no less than 0 USD.
4. WHEN the Customs_Calculator selects the Four_By_Four_Regime for a package, THE Customs_Calculator SHALL set the total amount due in the Tax_Result exactly equal to the Flat_Fee amount, with the Ad_Valorem_Tariff amount and the VAT amount contributing 0 USD.
5. IF the Customs_Calculator selects the Four_By_Four_Regime for a package AND the configured Flat_Fee is negative, THEN THE Customs_Calculator SHALL return a validation error identifying the configured Flat_Fee as the invalid field and SHALL NOT produce a Tax_Result.

### Requirement 3: Compute taxes and fees under the general import regime

**User Story:** As a small importer, I want the grimoire to compute tariffs and VAT for a package that exceeds the 4x4 limits, so that I can anticipate the full customs cost.

#### Acceptance Criteria

1. WHEN the Customs_Calculator selects the General_Import_Regime for a package, THE Customs_Calculator SHALL compute the Ad_Valorem_Tariff amount as the configured ad-valorem rate, expressed as a percentage no less than 0, applied to the FOB_Value, and SHALL record the result rounded to the nearest 0.01 USD in the Tax_Result.
2. WHEN the Customs_Calculator selects the General_Import_Regime for a package, THE Customs_Calculator SHALL compute the VAT amount as the configured VAT rate, expressed as a percentage no less than 0, applied to the sum of the FOB_Value and the Ad_Valorem_Tariff amount, and SHALL record the result rounded to the nearest 0.01 USD in the Tax_Result.
3. WHEN the Customs_Calculator selects the General_Import_Regime for a package, THE Customs_Calculator SHALL set the Flat_Fee amount to the configured Flat_Fee in the Tax_Result.
4. WHEN the Customs_Calculator selects the General_Import_Regime for a package, THE Customs_Calculator SHALL set the total amount due in the Tax_Result equal to the sum of the Ad_Valorem_Tariff amount, the VAT amount, and the Flat_Fee amount, rounded to the nearest 0.01 USD.
5. IF the Customs_Calculator selects the General_Import_Regime for a package AND the configured ad-valorem rate or the configured VAT rate is negative, THEN THE Customs_Calculator SHALL return a validation error identifying the invalid rate and SHALL NOT produce a Tax_Result.

### Requirement 4: Deterministic and non-negative calculation

**User Story:** As a developer, I want the customs calculation to be deterministic and well-bounded, so that it can be verified in isolation with property-based tests.

#### Acceptance Criteria

1. WHEN the Customs_Calculator evaluates two packages with identical Package_Weight, identical FOB_Value, and identical configuration, THE Customs_Calculator SHALL produce Tax_Result values whose applied regime and whose Ad_Valorem_Tariff amount, VAT amount, Flat_Fee amount, and total amount due are each equal, with every monetary amount rounded to 2 decimal places (nearest USD cent).
2. WHEN the Customs_Calculator produces a Tax_Result, THE Customs_Calculator SHALL return an Ad_Valorem_Tariff amount, a VAT amount, a Flat_Fee amount, and a total amount due that are each no less than 0 USD.
3. WHEN the Customs_Calculator produces a Tax_Result, THE Customs_Calculator SHALL return a total amount due no less than the configured Flat_Fee amount.
4. IF a package is evaluated with a negative Package_Weight or a negative FOB_Value, THEN THE Customs_Calculator SHALL return a validation error identifying the invalid field and SHALL NOT produce a Tax_Result.
5. IF a package is evaluated with a Package_Weight or an FOB_Value that is not a finite number, THEN THE Customs_Calculator SHALL return a validation error identifying the invalid field and SHALL NOT produce a Tax_Result.

### Requirement 5: Track the annual weight mana bar

**User Story:** As a cross-border shopper, I want to see how much of my annual weight quota I have consumed, so that I can avoid exceeding the yearly limit.

#### Acceptance Criteria

1. WHEN a cumulative Package_Weight for the year no less than 0 kg and an Annual_Weight_Limit greater than 0 kg are provided, THE Mana_Bar_Tracker SHALL compute the weight Usage_Percentage as the cumulative Package_Weight divided by the Annual_Weight_Limit multiplied by 100.
2. WHILE the weight Usage_Percentage is below the Warning_Threshold, THE Mana_Bar_Tracker SHALL report a normal status for the weight mana bar.
3. WHILE the weight Usage_Percentage is no less than the Warning_Threshold AND below the Critical_Threshold, THE Mana_Bar_Tracker SHALL report a warning status for the weight mana bar.
4. WHILE the weight Usage_Percentage is no less than the Critical_Threshold, THE Mana_Bar_Tracker SHALL report a limit-reached status for the weight mana bar.
5. IF a weight Usage_Percentage is requested with a negative cumulative Package_Weight, THEN THE Mana_Bar_Tracker SHALL reject the request, return a validation error identifying the cumulative Package_Weight as the invalid field, and produce no weight mana bar status.

### Requirement 6: Track the annual budget mana bar

**User Story:** As a small importer, I want to see how much of my annual import budget I have consumed, so that I can plan purchases within the yearly quota.

#### Acceptance Criteria

1. WHEN a cumulative FOB_Value no less than 0 USD for the year and an Annual_Budget_Limit greater than 0 USD are provided, THE Mana_Bar_Tracker SHALL compute the budget Usage_Percentage as the cumulative FOB_Value divided by the Annual_Budget_Limit multiplied by 100, and SHALL include that computed budget Usage_Percentage in its reported result.
2. WHILE the budget Usage_Percentage is no less than 0 percent AND below the Warning_Threshold of 80 percent, THE Mana_Bar_Tracker SHALL report a normal status for the budget mana bar.
3. WHILE the budget Usage_Percentage is no less than the Warning_Threshold of 80 percent AND below the Critical_Threshold of 100 percent, THE Mana_Bar_Tracker SHALL report a warning status for the budget mana bar.
4. WHILE the budget Usage_Percentage is no less than the Critical_Threshold of 100 percent, THE Mana_Bar_Tracker SHALL report a limit-reached status for the budget mana bar.
5. IF the budget Usage_Percentage is requested with a cumulative FOB_Value less than 0 USD, THEN THE Mana_Bar_Tracker SHALL reject the request, return a validation error identifying the cumulative FOB_Value as the invalid field, and SHALL NOT report a budget mana bar status.

### Requirement 7: Bound and validate mana bar calculations

**User Story:** As a developer, I want mana bar percentages to be deterministic and bounded, so that they can be verified in isolation with property-based tests.

#### Acceptance Criteria

1. WHEN the Mana_Bar_Tracker computes a Usage_Percentage from a cumulative consumed amount no less than 0 and a configured limit greater than 0, THE Mana_Bar_Tracker SHALL return a Usage_Percentage no less than 0.
2. WHEN the cumulative consumed amount is no greater than its configured limit, THE Mana_Bar_Tracker SHALL return a Usage_Percentage no greater than 100.
3. WHEN the cumulative consumed amount is greater than its configured limit, THE Mana_Bar_Tracker SHALL return a Usage_Percentage greater than 100 with no upper bound applied.
4. WHEN the Mana_Bar_Tracker computes a Usage_Percentage for a given cumulative amount and limit, THE Mana_Bar_Tracker SHALL produce an identical Usage_Percentage value for repeated computations with identical inputs.
5. IF a Usage_Percentage is requested with an Annual_Weight_Limit or Annual_Budget_Limit of 0 or less, THEN THE Mana_Bar_Tracker SHALL return a validation error identifying the invalid limit and SHALL NOT return a Usage_Percentage.
6. IF a Usage_Percentage is requested with a negative cumulative consumed amount, THEN THE Mana_Bar_Tracker SHALL return a validation error identifying the cumulative consumed amount as the invalid field and SHALL NOT return a Usage_Percentage.

### Requirement 8: Manage Quest stages

**User Story:** As a cross-border shopper, I want each package to progress through arcane delivery stages, so that I can see where each Quest currently stands.

#### Acceptance Criteria

1. WHEN a Quest is created, THE Quest_Tracker SHALL set the Quest_Stage to Origin_Portal.
2. WHEN a Quest at the Origin_Portal stage is advanced, THE Quest_Tracker SHALL set the Quest_Stage to Customs_Abyss.
3. WHEN a Quest at the Customs_Abyss stage is advanced, THE Quest_Tracker SHALL set the Quest_Stage to Guild_Delivery.
4. IF a Quest at the Guild_Delivery stage is advanced, THEN THE Quest_Tracker SHALL reject the advance, retain the Guild_Delivery stage, and return a validation error indicating that the Quest is already at the final stage.
5. IF a stage change is requested that targets a Quest_Stage other than the immediately following Quest_Stage in the sequence Origin_Portal, Customs_Abyss, Guild_Delivery, THEN THE Quest_Tracker SHALL reject the stage change, retain the current Quest_Stage, and return a validation error identifying the rejected target Quest_Stage.
6. IF a stage change is requested that targets a value that is not one of Origin_Portal, Customs_Abyss, or Guild_Delivery, THEN THE Quest_Tracker SHALL reject the stage change, retain the current Quest_Stage, and return a validation error identifying the invalid target Quest_Stage.
