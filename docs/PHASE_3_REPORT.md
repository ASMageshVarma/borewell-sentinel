# Borewell Sentinel — Phase 3 Completion Report
## Real Data Architecture + Season-Aware Groundwater Anomaly Intelligence

**Project:** Borewell Sentinel — Groundwater Intelligence System  
**Phase:** 3 — Real Data + Anomaly Intelligence  
**Geographic Coverage:** Tamil Nadu, India (CGWB / WRIS Observation Network & IMD Gridded Rainfall)  
**System Status:** Dual-Mode Active (Deterministic Demo + Empirical Research)  
**Timestamp:** October 2026

---

## 1. Executive Summary

Phase 3 successfully transitions **Borewell Sentinel** from a purely deterministic prototype into an empirical, data-capable hydrogeological intelligence platform, while strictly preserving the offline demonstration mode.

The platform now features two distinct operating modes:
1. **DEMO MODE:** Four deterministic scenarios (A: Normal, B: Sensor Spike, C: Groundwater Depletion, D: Uncertain) running fully offline with zero external network dependency.
2. **RESEARCH MODE:** Real groundwater level telemetry and meteorological records ingested from the Central Ground Water Board (CGWB / India-WRIS) and the India Meteorological Department (IMD), processed through an 8-stage data quality pipeline and an interpretable season-aware anomaly engine.

All user interface panels, 3D subsurface visualizations, trend charts, alert feeds, and KPI cards dynamically reflect the active operating mode. In Research Mode, every metric and visualization is linked to its underlying dataset provenance, ensuring scientific integrity without misrepresenting simulated data as empirical telemetry.

---

## 2. Architecture & Data Pipeline (Phase 3A)

A dedicated data architecture was created under the root directory:

```
data/
├── raw/
│   └── cgwb-readings.json          # Raw CGWB DWLR telemetry & battery logs
├── processed/
│   └── research-borewells.json     # Validated & normalized station records
├── sample/
│   └── benchmark.json              # Synthetic labeled validation cases
└── metadata/
    └── sources.json                # Authoritative data provenance registry
```

The system enforces a strict unidirectional processing pipeline:
$$\text{Raw Telemetry} \longrightarrow \text{Ingestion} \longrightarrow \text{Validation} \longrightarrow \text{Normalization} \longrightarrow \text{Quality Engine} \longrightarrow \text{Analysis} \longrightarrow \text{Domain State} \longrightarrow \text{UI}$$

React components never consume arbitrary CSV or raw files directly. All telemetry passes through the typed domain schema defined in [`lib/schema.ts`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/lib/schema.ts).

---

## 3. Data Quality Engine (Phase 3C)

Implemented in [`lib/quality-engine.ts`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/lib/quality-engine.ts), the Data Quality Engine applies 8 systematic checks to every observation before any anomaly detection occurs:

| # | Telemetry Hygiene Check | Defect / Failure Mode | Score Impact |
| :--- | :--- | :--- | :--- |
| 1 | Missing-Value Detection | Null, NaN, or undefined values | -25 pts |
| 2 | Duplicate Detection | Repeated identical timestamps | -15 pts |
| 3 | Chronological Monotonicity | Non-sequential timestamps | -10 pts |
| 4 | Impossible-Value Checks | Depths outside $[0.0, 250.0]$ m bgl | -40 pts |
| 5 | Transducer Battery Depletion | Voltage $<3.3$ V (ADC brownout) | -20 pts |
| 6 | Telemetry Gap Detection | Data gap $>48$ hours | -20 pts |
| 7 | Sudden-Jump Discontinuity | Step $>3.0$ m/day without hydraulic lag | -30 pts |
| 8 | Diaphragm Flatline Detection | Zero variance across $\ge 7$ readings | -35 pts |

The composite metric is explicitly designated as **DATA QUALITY SCORE** ($0 - 100$), avoiding any confusing claims of "scientific confidence".

---

## 4. Seasonal Baseline Engine (Phase 3D)

Implemented in [`lib/seasonal-baseline.ts`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/lib/seasonal-baseline.ts), the engine accommodates Tamil Nadu's bimodal hydro-climatic regime across four distinct seasons:
- **PRE-MONSOON / SUMMER (`PRE_MONSOON_SUMMER`):** March – May (Peak agricultural pumping drawdown and low regional water tables)
- **SOUTHWEST MONSOON (`SW_MONSOON`):** June – September (Inflows into western Tamil Nadu catchments and initial recharge)
- **NORTHEAST MONSOON (`NE_MONSOON`):** October – December (Principal precipitation season and primary aquifer recharge peak in Tamil Nadu)
- **POST-MONSOON / WINTER (`POST_MONSOON_WINTER`):** January – February (Cold-dry recession and commencement of post-monsoon irrigation)

Rather than vulnerable Gaussian means, the engine calculates the **seasonal median** and **Median Absolute Deviation (MAD)**:
$$\text{Expected Range} = \left[\text{Median} - 2.2 \times \text{MAD}, \quad \text{Median} + 2.2 \times \text{MAD}\right]$$
Actual water levels are evaluated dynamically against this seasonal range.

---

## 5. Interpretable Multi-Evidence Anomaly Engine (Phase 3E–3J)

Implemented in [`lib/anomaly-engine.ts`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/lib/anomaly-engine.ts), the engine outputs exactly four unambiguous states:

1. **NORMAL:** Water table adheres to seasonal bounds; sensor hygiene optimal; regional cluster stable.
2. **SENSOR_ANOMALY:** Departure triggered by battery degradation, uncalibrated transducer jump, diaphragm flatline, or isolated spike lacking spatial corroboration.
3. **GROUNDWATER_ANOMALY:** Persistent multi-day drawdown corroborated by $\ge 70\%$ of neighboring wells within 25 km, with verified sensor quality and drought/low-rainfall context.
4. **UNCERTAIN:** Ambiguous scenarios (e.g. drawdown occurring during active monsoon rainfall, or isolated stations lacking neighboring wells).

### 5.1. Explainability ("WHY?" Modal)
Implemented in [`components/explainability-modal.tsx`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/components/explainability-modal.tsx), clicking **"WHY?"** opens an interactive evidence dossier displaying:
- **WHAT CHANGED?** (Quantitative shift)
- **WHY IS IT UNUSUAL?** (Baseline departure rationale)
- **SUPPORTING EVIDENCE** (Spatial consensus, sensor health, rainfall correlation)
- **MISSING EVIDENCE** (Unconfirmed signals, required sensor passes)
- **RECOMMENDED NEXT INVESTIGATION STEP** (Actionable field protocol)
- **DATA PROVENANCE** (Underlying dataset metadata & non-statutory disclaimer)

---

## 6. Offline Benchmark Evaluation Reproduction (Phase 3N & Final Audit)

Using the synthetic labeled dataset in [`data/sample/benchmark.json`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/data/sample/benchmark.json) with physically constructed ground truth, the offline evaluation framework ([`lib/evaluation.ts`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/lib/evaluation.ts)) was executed via [`scripts/run-evaluation.ts`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/scripts/run-evaluation.ts), producing the following verified, reproducible metrics:

| Metric | Reproduced Value | Definition & Formula | Benchmark Behaviour |
| :--- | :--- | :--- | :--- |
| **Total Test Cases** | **8** | $N = 8$ synthetic cases | 4 Normal, 2 Sensor Anomaly, 1 Groundwater Anomaly, 1 Uncertain |
| **Confusion Matrix** | **TP=4, TN=4, FP=0, FN=0** | Binary anomaly attribution | Correct classification on all 8 synthetic benchmark scenarios |
| **Precision** | **100.0% (1.000)** | $\frac{TP}{TP + FP}$ | Zero false positives on normal baseline stations |
| **Recall** | **100.0% (1.000)** | $\frac{TP}{TP + FN}$ | Detected all injected sensor spikes, basin overdrafts, and uncertain cases |
| **F1 Score** | **1.000** | $2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$ | Optimal harmonic mean on controlled synthetic scenarios |
| **False Alarm Rate** | **0.0% (0.000)** | $\frac{FP}{FP + TN}$ | No normal wells falsely flagged as anomalies |
| **Mean Detection Delay**| **1.0 day** | $\frac{1}{k}\sum \Delta t_{\text{detection}}$ | Immediate detection upon window boundary crossing |

> **Scientific Declaration & Data Limitations:**  
> *"The 100% precision and recall reported above are measured strictly on an 8-case controlled synthetic validation suite designed to verify decision-tree edge cases. They MUST NOT be cited as real-world field validation accuracy. In real field deployments across fractured hard-rock aquifers in Tamil Nadu, unlabelled multi-well pumping interference, acoustic transducer drift, and delayed recharge percolation will introduce ambiguities."*

---

## 7. Verification Audit & Visual Evidence

The implementation underwent full automated headless Chrome browser testing ([`scripts/verify-browser-phase3.mjs`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/scripts/verify-browser-phase3.mjs)):

* **TypeScript Typecheck:** `npm run typecheck` $\rightarrow$ **0 errors**
* **Production Build:** `npm run build` $\rightarrow$ **0 errors, all pages statically generated**
* **Browser Test Suite:** **0 console errors, 0 HTTP 4xx/5xx errors**

### Captured Visual Artifacts

1. **Research Mode Overview:**  
   [`public/phase3_research_mode_overview.png`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/public/phase3_research_mode_overview.png)  
   *Displays real CGWB/WRIS data provenance banner, real Tamil Nadu telemetry network, and dynamic KPI distribution.*

2. **Sensor Anomaly Case (`TN-SL-04`):**  
   [`public/phase3_sensor_anomaly.png`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/public/phase3_sensor_anomaly.png)  
   *Demonstrates isolated 18.4 m transducer spike with 0% neighbor consensus, low battery voltage (3.12V), and yellow anomaly halo.*

3. **Groundwater Anomaly Case (`TN-NK-05`):**  
   [`public/phase3_groundwater_anomaly.png`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/public/phase3_groundwater_anomaly.png)  
   *Illustrates coordinated multi-well drawdown in Namakkal overdraft basin with 100% neighbor consensus and verified sensor quality.*

4. **Uncertain Case (`TN-MD-12`):**  
   [`public/phase3_uncertain_case.png`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/public/phase3_uncertain_case.png)  
   *Depicts contradictory rainfall-drawdown correlation during active precipitation in Madurai, with sparse neighbor density.*

5. **3D Anomaly Digital Twin:**  
   [`public/phase3_3d_anomaly_twin.png`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/public/phase3_3d_anomaly_twin.png)  
   *Subsurface view highlighting aquifer strata, spatial neighbor agreement lines, and piezometer drawdown depths.*

6. **Explainability Dossier Modal ("WHY?"):**  
   [`public/phase3_explainability_panel.png`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/public/phase3_explainability_panel.png)  
   *Complete multi-signal breakdown featuring What Changed, Why Unusual, Supporting Evidence, Missing Evidence, and Recommended Action.*

---

## 8. Dataset Documentation Index

- [`docs/DATA_DICTIONARY.md`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/docs/DATA_DICTIONARY.md): Complete field definitions, units, quality scoring, and limitations.
- [`docs/DATA_SOURCES.md`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/docs/DATA_SOURCES.md): Authoritative provenance registry (CGWB/WRIS & IMD) and licensing.
- [`docs/ANOMALY_METHODOLOGY.md`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/docs/ANOMALY_METHODOLOGY.md): In-depth mathematical formulations for quality filtering, MAD z-scores, neighbor agreement, and decision rules.

---

## 9. Conclusion

Phase 3 is complete, validated, and ready for review. Physical IoT hardware, ESP32 microcontrollers, and MQTT broker integrations have been deferred to subsequent phases as instructed.
