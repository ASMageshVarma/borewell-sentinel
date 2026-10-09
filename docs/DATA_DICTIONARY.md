# Borewell Sentinel — Data Dictionary (Phase 3)

**Document Version:** 1.0.0  
**Domain:** Groundwater Telemetry, Hydrogeology & Agro-meteorology  
**Geographic Coverage:** Tamil Nadu, India (CGWB Southern Region / WRIS & IMD Gridded Data)

---

## 1. Overview & Data Philosophy

Borewell Sentinel enforces strict separation between **Raw Telemetry**, **Quality Filtered Observations**, and **Model Intelligence**. The application adheres to a rigorous typed schema (`lib/schema.ts`) and forbids components from reading unstructured or raw files directly.

```
RAW TELEMETRY FILE (CSV / JSON)
            ↓
INGESTION & VALIDATION LAYER
            ↓
NORMALIZATION & QUALITY ENGINE (8 Checks)
            ↓
PROCESSED HYDROGEOLOGICAL ENTITY
            ↓
SEASONAL BASELINE & TEMPORAL ENGINE
            ↓
DOMAIN STATE & UI DASHBOARD
```

---

## 2. Core Entities & Field Specifications

### 2.1. Groundwater Telemetry (`GroundwaterReading`)

Represents an individual physical depth observation recorded by a Digital Water Level Recorder (DWLR) pressure transducer or hydrogeologist manual acoustic sounding tape.

| Field Name | Type | Unit | Range / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `stationId` | `string` | — | e.g., `TN-NK-05` | Unique national/state telemetry identifier |
| `timestamp` | `string` (ISO 8601) | UTC / IST | `YYYY-MM-DDTHH:mm:ssZ` | Observation timestamp in chronological sequence |
| `waterLevel` | `number` | meters (m bgl) | `0.0` to `250.0` m | Depth to groundwater level below ground level (bgl). Higher value indicates deeper/more depleted water table. |
| `waterLevelMsl` | `number` (optional) | m amsl | `0.0` to `1200.0` m | Water table elevation above mean sea level |
| `temperature` | `number` (optional) | °C | `10.0` to `45.0` °C | Borewell downhole water temperature |
| `batteryVoltage` | `number` (optional) | Volts (V) | `2.5` to `4.2` V | Transducer telemetry unit lithium battery voltage |
| `latitude` | `number` | decimal degrees | `8.0` to `14.0` °N | WGS84 latitude coordinate |
| `longitude` | `number` | decimal degrees | `76.0` to `81.0` °E | WGS84 longitude coordinate |
| `source` | `DataSourceType` | Enum | `CGWB_WRIS`, `STATE_GW_DEPT`, `IMD_GRIDDED`, `SYNTHETIC_BENCHMARK` | Authoritative provenance agency |
| `qualityFlags` | `QualityFlag[]` | Array of Enums | See Section 3 | Anomaly / data defect flags flagged by Quality Engine |

---

### 2.2. Rainfall Precipitation (`RainfallReading`)

Represents precipitation recorded by automated weather stations (AWS) or gridded daily agro-meteorological reanalysis.

| Field Name | Type | Unit | Range / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `stationId` | `string` | — | e.g., `IMD-NMK-01` | Gridded meteorological cell or station identifier |
| `timestamp` | `string` (ISO 8601) | UTC / IST | `YYYY-MM-DD` | Daily accumulation period |
| `rainfall` | `number` | millimeters (mm) | `0.0` to `400.0` mm | 24-hour cumulative rainfall |
| `source` | `DataSourceType` | Enum | `IMD_GRIDDED`, `TNSDMA_AWS` | Meteorological data source |
| `confidence` | `number` (optional) | Normalized (0–1) | `0.0` to `1.0` | Gridded interpolation confidence score |

---

### 2.3. Seasonal Baseline Model (`SeasonalBaseline`)

Represents season-aware statistical expectations calculated for Tamil Nadu's bimodal hydro-climatic regimes.

| Field Name | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `stationId` | `string` | — | Well station identifier |
| `season` | `Season` | Enum | One of: `PRE_MONSOON_SUMMER` (Mar–May), `SW_MONSOON` (Jun–Sep), `NE_MONSOON` (Oct–Dec), `POST_MONSOON_WINTER` (Jan–Feb) |
| `median` | `number` | m bgl | Historical median groundwater depth for season |
| `mad` | `number` | m | Median Absolute Deviation of groundwater depth |
| `expectedMin` | `number` | m bgl | Lower plausible boundary (`median - 2.5 * MAD`) |
| `expectedMax` | `number` | m bgl | Upper plausible boundary (`median + 2.5 * MAD`) |
| `historicalSamples` | `number` | Count | Number of historical observation cycles assimilated |

---

### 2.4. Sensor Health Assessment (`SensorHealth`)

Provides diagnostic indicators for telemetry hardware integrity. *Note: Battery voltage, RSSI, and packet loss are synthesized diagnostic fields because CGWB/India-WRIS web endpoints do not expose internal transducer battery telemetry.*

| Field Name | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `hardwareId` | `string` | — | Hardware MAC / serial number |
| `batteryVoltage` | `number` | Volts (V) | Telemetry unit battery voltage |
| `isBatteryLow` | `boolean` | Flag | `true` if voltage `< 3.3V` |
| `signalStrength` | `number` | dBm | Cellular / LoRa telemetry signal RSSI |
| `packetLossRate` | `number` | Percentage (%) | Packet dropout rate over 30-day window |
| `isFlatlined` | `boolean` | Flag | Transducer diaphragm mechanical seizure indicator |
| `hasSuddenStep` | `boolean` | Flag | Uncalibrated transducer physical slip indicator |
| `healthScore` | `number` | 0 – 100 | Composite hardware reliability score |

---

### 2.5. Anomaly Assessment Output (`AnomalyAssessment`)

Structured diagnostic verdict generated by the interpretable multi-evidence engine.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `classification` | `AnomalyClassification` | `NORMAL`, `SENSOR_ANOMALY`, `GROUNDWATER_ANOMALY`, `UNCERTAIN` | High-level diagnostic classification |
| `severity` | `AnomalySeverity` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Operational priority |
| `evidence` | `AnomalyEvidence` | Object | Transparent collection of hydrogeological & sensor signals |
| `modelConfidence` | `number` | 0 – 100 (%) | **Empirical Heuristic Consensus Score** reflecting multi-signal agreement (quality + spatial consensus + deviation severity). *This is NOT a calibrated Bayesian probability.* |
| `recommendedAction` | `string` | Text | Prescribed field procedure or hydrogeological survey step |
| `whatChanged` | `string` | Text | Human-interpretable synopsis of metric shift |
| `whyUnusual` | `string` | Text | Scientific rationale why reading violates baseline expectations |
| `missingEvidence` | `string` | Text | Incomplete signals preventing higher certainty |

---

### 2.6. Measurement Direction and Rate-of-Change Conventions

* **Groundwater Level (`waterLevel`):** Expressed in **meters below ground level (`m bgl`)**. A higher numeric value represents a deeper water table (drawdown/depletion); a lower numeric value represents a shallower water table (recharge/recovery).
* **7-Day Rate of Change (`delta7d`):** Follows hydrological delta convention. A **negative value** (e.g. $-2.8$ m) represents **drawdown/depletion** (the water table dropped deeper by $2.8$ m). A **positive value** (e.g. $+1.5$ m) represents **recharge/recovery** (the water table rose shallower by $1.5$ m).

---

## 3. Data Quality Flags & Scored Deductions

The Quality Engine computes a **DATA QUALITY SCORE** on a scale from 0 to 100. Rather than claiming "scientific confidence", the score is an engineering measure of telemetry hygiene.

| Flag Enum | Description | Deduction | Trigger Condition |
| :--- | :--- | :--- | :--- |
| `MISSING_VALUE` | Null, undefined, or NaN depth value | -25 | `val === null \|\| isNaN(val)` |
| `DUPLICATE_TIMESTAMP` | Identical timestamp repeated for station | -15 | `records[t] == records[t-1]` |
| `IMPOSSIBLE_VALUE` | Value out of physical Earth boundaries | -40 | `val < 0.0` or `val > 250.0 m bgl` |
| `BATTERY_DEPLETED` | Transducer power below brownout floor | -20 | `batteryVoltage < 3.3V` |
| `TELEMETRY_LONG_GAP` | Telemetry hiatus between successive packets | -20 | `dt > 48 hours` |
| `SUDDEN_JUMP` | Discontinuous step without hydrogeologic lag | -30 | `\|val_t - val_t-1\| > 3.0 m in 24h` |
| `FLATLINE` | Exactly 0 variance over long window | -35 | Zero variance across $\ge 7$ readings |
| `UNRELIABLE_SENSOR` | Cumulative score dropped below threshold | -10 | Total quality score `< 60` |

---

## 4. Known Data Limitations & Caveats

1. **Acoustic / Transducer Drift:** Piezoresistive pressure sensors suffer thermal and drift errors over seasonal cycles of $\pm 0.15$ m.
2. **Rainfall Lag Inhomogeneity:** In fractured crystalline hard-rock aquifers (e.g., Namakkal, Salem charnockites), recharge infiltration delays range from 48 hours to 21 days depending on weathered regolith thickness.
3. **Pumping Drawdown Interference:** Agricultural tube wells operating within 200 m of a monitoring piezometer introduce temporary pumping cones of depression that mimic rapid depletion anomalies.
