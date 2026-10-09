# Borewell Sentinel — Data Sources & Provenance Catalog (Phase 3)

**Document Version:** 1.0.0  
**Status:** Research Mode Authoritative Registry  
**Geographic Domain:** Tamil Nadu, India

---

## 1. Overview

In compliance with **Phase 3 Scientific Integrity Requirements**, Borewell Sentinel strictly differentiates between **simulated demonstration scenarios** and **real observational datasets**. 

Every metric, chart, and anomaly assessment presented in **Research Mode** is linked to an underlying data source cataloged in this repository under:
- `data/metadata/sources.json`
- `data/raw/`
- `data/processed/`
- `data/sample/`

---

## 2. Authoritative Data Sources

### 2.1. Central Ground Water Board (CGWB) & India-WRIS

* **Institution:** Central Ground Water Board (CGWB), Department of Water Resources, River Development and Ganga Rejuvenation, Ministry of Jal Shakti, Government of India.
* **Portal / Platform:** India Water Resources Information System ([India-WRIS](https://indiawris.gov.in)).
* **Instrumentation Type:** Digital Water Level Recorders (DWLR) equipped with piezoresistive pressure transducers and automated telemetry units (ATU) transmitting via GPRS/GSM.
* **Geographic Coverage:** Tamil Nadu Observation Wells Network (focus basins: Namakkal, Salem, Coimbatore, Madurai, Karur, Thanjavur).
* **Observed Parameters:**
  - Depth to water table below ground level (`m bgl`)
  - Telemetry battery voltage (`V`)
  - Water temperature (`°C`)
  - Station geospatial coordinates (WGS84)
* **Sampling Cadence:** 6-hour automated telemetry snapshots, aggregated into daily representative groundwater depths.
* **Access License:** Open Government Data (OGD) Platform India (National Data Sharing and Accessibility Policy - NDSAP).

### 2.2. India Meteorological Department (IMD)

* **Institution:** India Meteorological Department (IMD), Ministry of Earth Sciences, Government of India.
* **Portal / Dataset:** IMD High-Resolution Daily Gridded Rainfall Data ($0.25^\circ \times 0.25^\circ$).
* **Parameters:** 24-hour accumulated rainfall precipitation in millimeters (`mm`).
* **Temporal Integration:** Daily rainfall measurements aggregated across 7-day, 14-day, and 30-day antecedent windows for recharge lag modeling.
* **Access License:** Research and non-commercial open data usage under IMD Data Dissemination Guidelines.

### 2.3. Tamil Nadu State Ground & Surface Water Resources Data Centre

* **Institution:** Water Resources Department (WRD), Government of Tamil Nadu.
* **Usage:** Lithological log cross-referencing and seasonal baseline calibration (Charnockite, Granitic Gneiss, Alluvial river terraces).
* **Baseline Periods:** Historical observations spanning 2014–2024 to establish Pre-monsoon, Monsoon, Post-monsoon, and Dry seasonal median water table depths.

### 2.4. Synthetic Labeled Benchmark Dataset

* **Location:** `data/sample/benchmark.json`
* **Purpose:** Controlled validation of anomaly detection algorithms where ground-truth physical verification exists.
* **Synthesis Rules:** Real historical observation baseline series perturbed with known fault injections:
  - Transducer voltage brownout spikes
  - Mechanical diaphragm flatlines
  - Extreme regional agricultural draft drawdowns
  - Cloudburst delayed recharge contradictions

---

## 3. Data Processing Architecture

To prevent unvalidated telemetry from destabilizing the user experience, the data pipeline follows a strict unidirectional flow:

```
[ CGWB / India-WRIS CSV Telemetry ]       [ IMD Gridded Rainfall Series ]
                 │                                        │
                 ▼                                        ▼
      ┌────────────────────────────────────────────────────────┐
      │           data/raw/cgwb-readings.json                  │
      │           Raw observation records & battery stats      │
      └────────────────────────────────────────────────────────┘
                                   │
                                   ▼
      ┌────────────────────────────────────────────────────────┐
      │             lib/ingestion.ts (Ingestion Engine)        │
      │             - Schema validation (lib/schema.ts)        │
      │             - Coordinate bounding check (Tamil Nadu)   │
      │             - Chronological sorting & deduplication    │
      └────────────────────────────────────────────────────────┘
                                   │
                                   ▼
      ┌────────────────────────────────────────────────────────┐
      │           lib/quality-engine.ts (Quality Engine)       │
      │           - 8 telemetry hygiene & defect checks        │
      │           - Computes DATA QUALITY SCORE (0 - 100)      │
      └────────────────────────────────────────────────────────┘
                                   │
                                   ▼
      ┌────────────────────────────────────────────────────────┐
      │        lib/seasonal-baseline.ts & anomaly-engine.ts     │
      │        - Season-aware Hampel filter & MAD z-score      │
      │        - Multi-station spatial coherence (15-25 km)     │
      │        - Hydro-climatic rainfall recharge correlation  │
      └────────────────────────────────────────────────────────┘
                                   │
                                   ▼
      ┌────────────────────────────────────────────────────────┐
      │            ResearchBorewell Entity (Domain State)      │
      │            - Transparent Attribution                   │
      │            - Explainability Evidence Dossier           │
      │            - UI Components Consumption                 │
      └────────────────────────────────────────────────────────┘
```

---

## 4. Scientific Integrity & Attribution Declarations

1. **No Data Conflation:** The system explicitly labels Research Mode with dataset metadata (`CGWB / WRIS National Telemetry Network` and `IMD Gridded Daily Rainfall v4.0`).
2. **Deterministic Offline Fallback:** If live network or raw data feeds are unavailable, the application provides the four deterministic scenarios under **Demo Mode**, without misrepresenting them as live empirical data.
3. **Transparent Quality Scores:** No data point is claimed to possess "scientific certainty"; rather, each observation displays an empirical **DATA QUALITY SCORE** reflecting missingness, jitter, and voltage stability.
