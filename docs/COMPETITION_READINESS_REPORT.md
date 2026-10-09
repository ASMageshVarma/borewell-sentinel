# Borewell Sentinel — Competition Readiness Report & Final Audit

**Document Version:** 1.0.0 (Pre-Competition Freeze)  
**System Title:** Borewell Sentinel — Groundwater Intelligence System  
**Evaluation Scope:** Phase 3 Architecture, Hydrogeological Models, Telemetry Ingestion & UI  
**Target Milestone:** October 10 Presentation  
**Status:** Audit Completed & System Frozen  

---

## 1. Verified Facts & System Provenance

### 1.1. Dual Operating Modes
* **DEMO MODE (100% Offline):** Four deterministic scenarios (**A — Normal**, **B — Sensor Spike**, **C — Groundwater Depletion**, **D — Uncertain**) execute locally without requiring an active internet connection or external services.
* **RESEARCH MODE:** Ingests real Central Ground Water Board (**CGWB / India-WRIS**) DWLR groundwater level observations and India Meteorological Department (**IMD**) gridded precipitation records across 8 Tamil Nadu monitoring stations.

### 1.2. Telemetry and Spatial Coverage
* **Target Basin:** Tamil Nadu, India (Salem, Namakkal, Dharmapuri, Coimbatore, Erode, Tiruppur, Madurai, Karur).
* **Groundwater Telemetry Source:** CGWB National Water Informatics Centre / India-WRIS portal (`https://indiawris.gov.in/wris/`).
* **Precipitation Source:** IMD National Data Centre (`https://mausam.imd.gov.in/`).
* **Ingestion Hygiene Pipeline:** Raw data passes through 8 deterministic validation filters in [`lib/quality-engine.ts`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/lib/quality-engine.ts) before any anomaly calculation occurs.

### 1.3. Tamil Nadu Seasonal Regime Calibration
* The baseline model in [`lib/seasonal-baseline.ts`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/lib/seasonal-baseline.ts) strictly differentiates the Tamil Nadu agro-climatic calendar:
  - **`PRE_MONSOON_SUMMER` (March – May):** Intensive irrigation pumping, highest depth below ground level (lowest water table).
  - **`SW_MONSOON` (June – September):** Inflows into western catchment reservoirs (Kaveri, Bhavani, Amaravathi).
  - **`NE_MONSOON` (October – December):** Primary rainfall and groundwater recharge season across coastal and interior Tamil Nadu.
  - **`POST_MONSOON_WINTER` (January – February):** Post-monsoon cold-dry recession and rabi crop water withdrawal.

### 1.4. Measurement Conventions & Units
* **Groundwater Depth (`waterLevel`):** Expressed strictly as **depth below ground level in meters (`m bgl`)**. A higher numeric value represents a deeper water table (drawdown/depletion); a lower value represents a shallower water table (recharge).
* **7-Day Rate of Change (`delta7d`):** A **negative value** indicates **drawdown/depletion** (e.g. $-2.8$ m signifies the water table dropped $2.8$ m deeper); a **positive value** indicates **recharge/recovery** (e.g. $+1.5$ m signifies water level rose).

---

## 2. Reproduced Test Results

### 2.1. Code Quality & Build Verification
* **TypeScript Compilation:** `npm run typecheck` (`tsc --noEmit`) $\rightarrow$ **0 errors**
* **Production Build:** `npm run build` (Next.js 14 SSG/SSR) $\rightarrow$ **0 errors, all pages statically generated**
* **Automated Headless Browser Suite (`scripts/verify-browser-phase3.mjs`):**
  - **Console Errors:** `0`
  - **HTTP 4xx / 5xx Network Errors:** `0`
  - **Mode Switching:** Demo Mode $\leftrightarrow$ Research Mode verified with clean state persistence.
  - **Modal Isolation:** Explainability panel ("WHY?") opens with `z-index: 10000`, cleanly isolating all 3D canvas labels (`zIndexRange={[10, 0]}`).
  - **Chart Scaling:** Water table trend chart Y-axis dynamically accommodates deep wells up to 25.0 m bgl without clipping.

### 2.2. Offline Benchmark Reproduction
Executed via [`scripts/run-evaluation.ts`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/scripts/run-evaluation.ts) against the controlled validation suite [`data/sample/benchmark.json`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/data/sample/benchmark.json):

| Metric | Measured Value | Formal Definition | Status |
| :--- | :--- | :--- | :--- |
| **Total Test Cases** | **8** | 4 Normal, 2 Sensor Anomaly, 1 Groundwater Depletion, 1 Uncertain | Verified |
| **Confusion Matrix** | **TP=4, TN=4, FP=0, FN=0** | Anomaly presence vs normal baseline | Verified |
| **Precision** | **100.0% (1.000)** | $\frac{TP}{TP + FP}$ | Verified |
| **Recall** | **100.0% (1.000)** | $\frac{TP}{TP + FN}$ | Verified |
| **F1 Score** | **1.000** | $2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$ | Verified |
| **False Alarm Rate** | **0.0% (0.000)** | $\frac{FP}{FP + TN}$ | Verified |
| **Mean Detection Delay** | **1.0 day** | $\frac{1}{k} \sum \Delta t_{\text{detection}}$ | Verified |

---

## 3. Data Limitations & Honest Boundaries

1. **Synthetic vs. Empirical Benchmark:**  
   The benchmark dataset consists of **8 controlled synthetic validation test cases** engineered with ground-truth fault injections (low voltage, single-point transducer step, coordinated multi-well overdraft, rainfall contradiction). The 100% precision/recall verifies the software implementation and logic rules, **not** real-world field accuracy.
2. **Synthesized Sensor Health Fields:**  
   While raw depth measurements and rainfall are grounded in official CGWB and IMD publications, CGWB DWLR portals do not publish transducer hardware telemetry (battery voltage, RSSI, packet loss). These diagnostic fields are generated as representative values in Research Mode to demonstrate the hardware triage capability.
3. **Absence of Independently Labelled Field Anomalies:**  
   Indian groundwater monitoring networks lack gold-standard historical labels identifying whether historical drops were sensor glitches or pumping drawdowns. Field validation will require prospective trial deployments with manual acoustic dip-meter corroboration.
4. **Hard-Rock Hydrogeological Heterogeneity:**  
   Tamil Nadu aquifers are predominantly weathered and fractured crystalline rocks (charnockites, gneisses). Hydraulic conductivity is heterogeneous; adjacent wells separated by only 500 meters may tap independent fracture networks. Spatial consensus is an indicator, not definitive proof.

---

## 4. Known Issues & Operational Considerations

1. **Client-Side WebGL Dependency:**  
   The 3D Subsurface Twin requires WebGL support (standard in modern Chrome, Edge, Safari, Firefox). On older machines without hardware acceleration, smooth frame rates depend on software rendering. The Command Center remains fully operational even if 3D rendering is throttled.
2. **Network Isolation:**  
   The application does not make live outbound HTTP requests during runtime. All data is pre-ingested, validated, and packaged locally, ensuring robust offline demonstrations during competitions or poor venue Wi-Fi.

---

## 5. Exact Startup Commands

### Development Server
```bash
npm run dev
```
Accessible at: `http://localhost:3000`

### Production Build & Launch (Recommended for Competition)
```bash
npm run build
npm start
```
Accessible at: `http://localhost:3000`

### Reproducing Benchmark Evaluation
```bash
npx tsx scripts/run-evaluation.ts
```

### Running Automated Browser Verification Suite
```bash
node scripts/verify-browser-phase3.mjs
```

---

## 6. Recommended 4-Minute Presentation Sequence

| Time | Action | What to Show | Key Point to State |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:45** | **The Problem & Command Center** | Launch in **DEMO MODE**. Point to KPI cards, alert feed, and 3D Subsurface Twin. | *"Groundwater networks across India face a massive attribution challenge: is a water table drop an aquifer emergency or just a failed pressure transducer? Static alerts cause alarm fatigue."* |
| **0:45 – 1:30** | **Demo Scenarios (A $\rightarrow$ B $\rightarrow$ C $\rightarrow$ D)** | Click Scenario B (Sensor Spike), then Scenario C (GW Depletion). | *"Scenario B catches a sudden 18m drop, but the engine checks neighbors and battery voltage—flagging it as a SENSOR FAULT. Scenario C shows 4 wells dropping together with 100% neighbor consensus—flagged as TRUE DEPLETION."* |
| **1:30 – 2:30** | **Explainability Dossier ("WHY?")** | Click the **"WHY?"** button on the selected well. | *"No black boxes. Operators see What Changed, Why Unusual, Supporting Signals, Missing Signals, and Recommended Field Next Steps."* |
| **2:30 – 3:15** | **Switch to RESEARCH MODE** | Toggle the top-bar switch to **RESEARCH MODE**. | *"Here we ingest real CGWB DWLR telemetry and IMD rainfall from Tamil Nadu through our 8-stage data quality pipeline."* |
| **3:15 – 3:45** | **3D Subsurface Digital Twin** | Rotate 3D view; toggle Stratum Slicing; point to neighbor consensus lines. | *"The 3D digital twin maps aquifer layers, piezometric cones of depression, and inter-well spatial connectivity in real time."* |
| **3:45 – 4:00** | **Scientific Integrity & Wrap-up** | Conclude on the data provenance banner and audit findings. | *"We do not claim black-box AI magic. We deliver transparent, season-aware hydrogeological triage ready for field pilot testing."* |

---

## 7. Safe Wording for Claims Presented to Judges

### ✅ What You CAN Safely Say
* *"Borewell Sentinel is an interpretable multi-evidence decision-support system designed to distinguish sensor failure from genuine aquifer depletion."*
* *"We implement an 8-check engineering data quality filter and a season-aware baseline calibrated for Tamil Nadu's bimodal monsoon regime."*
* *"Our offline benchmark evaluates 8 controlled fault scenarios, correctly classifying all cases with zero false alarms on normal baselines."*
* *"In Research Mode, groundwater depths are sourced from official CGWB observation records, and rainfall is sourced from IMD gridded data."*
* *"The system provides actionable explainability dossiers for water resource engineers rather than unexplainable neural network predictions."*

### ❌ What You MUST NOT Claim
* ❌ *Do NOT claim:* "Our AI model is 100% accurate in the real world." *(The 100% metric is on controlled synthetic test cases).*
* ❌ *Do NOT claim:* "We have live IoT ESP32 hardware streaming right now." *(Hardware integration is scoped for subsequent phases).*
* ❌ *Do NOT claim:* "Our model proves legal over-exploitation." *(Hydraulic connectivity in hard-rock aquifers requires ground surveys).*
* ❌ *Do NOT claim:* "Model confidence is a Bayesian calibrated probability." *(It is an empirical heuristic consensus score).*
* ❌ *Do NOT claim:* "CGWB portals publish live transducer battery telemetry." *(Transducer battery levels are simulated diagnostic features).*

---

## 8. Audit Conclusion

All dataset files have been inspected and documented.  
Seasonal definitions strictly adhere to Tamil Nadu hydro-meteorological terminology.  
Measurement units and directions are validated throughout ingestion, baselines, and UI.  
The evaluation benchmark reproduces cleanly with zero fabricated claims.  
Both DEMO MODE and RESEARCH MODE are preserved, tested, and fully functional.  
TypeScript typechecking, production build, and headless browser tests pass with zero errors.

# **COMPETITION READY — AUDIT PASSED**
