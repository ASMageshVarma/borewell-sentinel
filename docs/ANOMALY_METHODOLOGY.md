# Borewell Sentinel — Anomaly Intelligence Methodology (Phase 3)

**Document Version:** 1.0.0  
**Domain:** Interpretable Hydrogeological & Sensor Telemetry Attribution  
**Target Architecture:** Modular Season-Aware Anomaly Engine  
**System Status:** Prototype Evaluation Architecture

---

## 1. Executive Summary & Core Philosophy

Groundwater monitoring networks across India (operated by CGWB and State Groundwater Departments) routinely suffer from an unresolved attribution challenge: **is a sudden reading drop or fluctuation caused by true aquifer depletion, or by a malfunctioning downhole pressure transducer?**

Traditional solutions either:
1. Rely on crude static thresholds (e.g. flagging any reading $>15$ m), which causes rampant false alarms across monsoon seasons; or
2. Propose opaque "black-box" deep neural networks (e.g. LSTMs / Transformers) that lack explainability, fail under non-stationary aquifer conditions, and cannot provide auditable evidence to water engineers.

**Borewell Sentinel Phase 3 solves this by implementing an Interpretable Multi-Evidence Engine.** Before any anomaly score is computed, raw data passes through an 8-check Data Quality Engine, a Season-Aware Baseline model, a Spatial Consistency Analyzer, and an Agro-Meteorological Rainfall Assessor.

```
                  ┌───────────────────────────────┐
                  │    Raw DWLR IoT Telemetry     │
                  └───────────────┬───────────────┘
                                  ▼
                  ┌───────────────────────────────┐
                  │   Data Quality Engine (8 QAs) │
                  │  Computes DATA QUALITY SCORE  │
                  └───────────────┬───────────────┘
                                  ▼
                  ┌───────────────────────────────┐
                  │   Season-Aware Baseline (MAD) │
                  │ Tamil Nadu Bimodal Agro-Regime│
                  └───────────────┬───────────────┘
                                  ▼
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     Spatial Consistency Check   │       │   Hydro-climatic Precipitation  │
│  Neighbor Agreement (15-25 km)  │       │  IMD 14-day antecedent rainfall │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 └────────────────┬────────────────────────┘
                                  ▼
                  ┌───────────────────────────────┐
                  │ Interpretable Decision Logic  │
                  │   Attribution & Confidence    │
                  └───────────────┬───────────────┘
                                  ▼
                  ┌───────────────────────────────┐
                  │  Explainability Dossier (WHY?)│
                  │   NORMAL / SENSOR / GW / UNC  │
                  └───────────────────────────────┘
```

---

## 2. Phase 3C: Data Quality Engine

Before computing hydrogeological deviations, telemetry must pass 8 validation filters (`lib/quality-engine.ts`). Each violation applies a deterministic penalty against the **DATA QUALITY SCORE** (initial baseline = 100):

1. **Missing-Value Detection:** Checks for `null`, `undefined`, or `NaN` depth records (Deduction: -25).
2. **Duplicate Timestamp Detection:** Identifies repeated identical timestamps per telemetry ID (Deduction: -15).
3. **Timestamp Sequence Validation:** Confirms strict chronological monotonicity without backward clock jumps.
4. **Physical Earth Boundary Checks:** Flags impossible water table depths ($<0.0$ m artesian overflow or $>250.0$ m crystalline bedrock limit; Deduction: -40).
5. **Transducer Voltage Brownout Check:** Detects telemetry unit lithium battery $<3.3$ V, causing ADC converter drift (Deduction: -20).
6. **Telemetry Transmission Gap Detection:** Flags data voids $>48$ hours indicating transmission blackouts (Deduction: -20).
7. **Sudden-Step Discontinuity Check:** Evaluates 24-hour rate of change $\left|\frac{\Delta d}{\Delta t}\right| > 3.0$ m/day. Hydraulic conductivities of unconfined crystalline aquifers in Tamil Nadu rarely allow natural recharge/drawdown to exceed 2.5 m/day (Deduction: -30).
8. **Mechanical Diaphragm Flatline Detection:** Detects zero variance over $\ge 7$ consecutive readings indicating sensor siltation or diaphragm seizure (Deduction: -35).

The resulting score is reported strictly as:
$$\text{DATA QUALITY SCORE} \in [0, 100]$$
*(Note: Terminology adheres strictly to engineering hygiene rather than claiming "scientific confidence".)*

---

## 3. Phase 3D: Season-Aware Baselines

A single universal static threshold is hydrogeologically invalid in Southern India. Tamil Nadu experiences a unique bimodal rainfall pattern driven by both the Southwest (SW) Monsoon (June–September) and the Northeast (NE) Monsoon (October–December), followed by a dry extraction season (January–May).

The engine assigns every observation to one of four seasonal periods tailored to Tamil Nadu:
- **PRE-MONSOON / SUMMER (`PRE_MONSOON_SUMMER`):** March – May (Summer dry season, intensive agricultural pumping, historical water level minima)
- **SOUTHWEST MONSOON (`SW_MONSOON`):** June – September (Inflows into western Tamil Nadu catchments, Kaveri/Bhavani river basin recharge)
- **NORTHEAST MONSOON (`NE_MONSOON`):** October – December (Principal precipitation season for coastal and interior Tamil Nadu; primary regional aquifer recharge peak)
- **POST-MONSOON / WINTER (`POST_MONSOON_WINTER`):** January – February (Cold dry period, water table recession)

For each monitoring station, historical monthly records calculate the seasonal median ($\tilde{x}$) and Median Absolute Deviation ($\text{MAD}$):
$$\text{MAD} = \text{median}\left(\left|x_i - \tilde{x}\right|\right)$$
$$\text{Expected Range} = \left[\tilde{x} - 2.2 \times \text{MAD}, \quad \tilde{x} + 2.2 \times \text{MAD}\right]$$

This season-aware window represents approximately $\pm 3.26$ standard deviations in Gaussian equivalent terms without being distorted by historical sensor spikes.

---

## 4. Phase 3E: Temporal Anomaly Engine

To ensure full auditability, the engine employs robust statistical indicators:

### 4.1. Robust Hampel Z-Score
$$z_{\text{robust}} = \frac{\left|x_t - \tilde{x}\right|}{1.4826 \times \text{MAD}}$$
Values where $z_{\text{robust}} \ge 2.5$ indicate statistically significant departures from seasonal equilibrium.

### 4.2. Persistence Count ($P$)
Defines how many consecutive days in the rolling 7-day window remain strictly outside the $[\text{Expected Range Min}, \text{Expected Range Max}]$ bounds. Isolated electrical noise persists for $\le 2$ days; true aquifer stress persists across $\ge 4$ days.

---

## 5. Phase 3H: Spatial Consistency & Neighbor Agreement

For every borewell, the engine calculates Euclidean spatial distance ($d_{ij}$) to all nearby stations within a 15–25 km hydrological radius.

$$\text{Neighbor Agreement Pct} = \frac{\sum_{j \in \mathcal{N}} \mathbb{I}\left(\text{sgn}(\Delta d_i) = \text{sgn}(\Delta d_j)\right)}{|\mathcal{N}|} \times 100\%$$

* **Isolated Shift:** One station drops sharply while all 4 neighbors remain stable ($\text{Agreement} < 40\%$) $\rightarrow$ Strongly favors **SENSOR ANOMALY**.
* **Coordinated Basin Shift:** Piezometer drop is corroborated by 3 or more neighboring wells ($\text{Agreement} \ge 70\%$) $\rightarrow$ Strongly favors **GROUNDWATER ANOMALY**.
* **Sparse Network:** Less than 2 neighboring stations available within radius $\rightarrow$ Classified as **UNCERTAIN**.

---

## 6. Phase 3I: Unambiguous 4-State Classification Logic

The system outputs exactly four diagnostic states:

```
                                  [ Assessment ]
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
  [ SENSOR ANOMALY ]          [ GROUNDWATER ANOMALY ]          [ UNCERTAIN ]
  - Quality score < 70 OR     - Persistent drop (P >= 4)       - Rainfall contradictory OR
  - Sudden jump > 2.5 m/d OR  - High agreement (>= 70%)       - Neighbor density < 2 OR
  - Low battery (< 3.3V) OR   - High quality score (>= 80)     - Quality score marginal
  - Isolated spike (Agree < 45%)- Low rainfall / dry season
```

1. **NORMAL:** Water level resides within expected seasonal bounds ($\pm 2.2 \text{ MAD}$); data quality verified; network consensus stable.
2. **SENSOR_ANOMALY:** Departure driven by low battery voltage, uncalibrated transducer jump, diaphragm flatline, or isolated spike without regional consensus.
3. **GROUNDWATER_ANOMALY:** Sustained multi-day drawdown corroborated by neighboring stations, with pristine sensor hygiene and drought/extraction meteorological context.
4. **UNCERTAIN:** Telemetry displays moderate deviation but exhibits conflicting evidence (e.g. drawdown occurring during an active cloudburst event, or isolated station lacking nearby corroboration).

---

## 7. Phase 3J: Explainability Framework ("WHY?")

When an operator clicks the **"WHY?"** button on any station or alert card, the modal renders 5 structured sections:

1. **WHAT CHANGED?** Exact quantitative shift (e.g., *"Persistent drop of 2.8 m observed over the past 7 days"*).
2. **WHY IS IT UNUSUAL?** Scientific rationale (e.g., *"Depletion breaches historical seasonal baseline by >2.5 MAD; departs from historical October post-monsoon recharge"*).
3. **WHAT EVIDENCE SUPPORTS THIS CLASSIFICATION?** Bulleted checklist of confirming signals (e.g., spatial agreement %, sensor voltage health, antecedent rainfall deficit).
4. **WHAT EVIDENCE IS MISSING OR UNCONFIRMED?** Signals requiring further confirmation (e.g., satellite GRACE-FO gravimetry, high-frequency 15-minute logger data).
5. **RECOMMENDED NEXT INVESTIGATION STEP:** Prescribed field protocol (e.g., *"Dispatch hydrogeological field team to inspect agricultural tube-well pumping cluster; cross-reference local electricity grid loads"*).

---

## 8. Limitations & Scientific Integrity

* **Model Nature:** The algorithms implemented represent prototype decision-support models based on statistical and spatial heuristic consensus.
* **No Statutory Causal Proof:** Classifications indicate "likely groundwater anomaly" or "model indicates sensor-consistent behaviour" and do not constitute legal or statutory proof of over-exploitation.
* **Geological Complexity:** Fractured crystalline aquifers (charnockites/granulites) can have compartmentalized fracture networks where adjacent wells 500 m apart do not exhibit hydraulic connectivity.

---

## 9. Evaluation Benchmark Reproduction & Ground Truth Integrity

The anomaly attribution pipeline is evaluated using [`data/sample/benchmark.json`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/data/sample/benchmark.json) via [`lib/evaluation.ts`](file:///c:/Users/MAGESH%20VARMA%20A%20S/Desktop/BOREWELL_SENTINEL_PROTOTYPE/lib/evaluation.ts) and executed via `npx tsx scripts/run-evaluation.ts`.

### 9.1. Benchmark Dataset Composition
The benchmark consists of 8 precisely controlled validation cases:
* **4 Normal Baseline Cases:** Station adhering strictly to historical seasonal baseline ranges (`TN-CM-01`, `TN-ER-02`, `TN-TR-03`, `TN-DG-06`).
* **2 Sensor Anomaly Cases:** Injected electrical voltage brownout / single-well transducer jump (`TN-SL-04`, `BW-02-SYNTH`).
* **1 Groundwater Depletion Anomaly Case:** Coordinated basin drawdown with high spatial neighbor agreement and low rainfall (`TN-NK-05`).
* **1 Uncertain Case:** Ambiguous drawdown occurring during high antecedent rainfall with low spatial consensus (`TN-MD-12`).

### 9.2. Metrics & Binary Confusion Matrix Formulation
For anomaly screening attribution:
* $\text{True Positive } (TP)$: Ground truth has an anomaly/uncertain state and model detects an anomaly/uncertain state.
* $\text{True Negative } (TN)$: Ground truth is normal and model predicts normal.
* $\text{False Positive } (FP)$: Ground truth is normal but model predicts anomaly.
* $\text{False Negative } (FN)$: Ground truth has an anomaly but model predicts normal.

$$\text{Precision} = \frac{TP}{TP + FP} = \frac{4}{4 + 0} = 1.000 \quad (100.0\%)$$
$$\text{Recall} = \frac{TP}{TP + FN} = \frac{4}{4 + 0} = 1.000 \quad (100.0\%)$$
$$\text{F1 Score} = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}} = 1.000$$
$$\text{False Alarm Rate (FAR)} = \frac{FP}{FP + TN} = \frac{0}{0 + 4} = 0.0\%$$
$$\text{Mean Detection Delay} = 1.0 \text{ day}$$

> **Scientific Boundary:** These metrics demonstrate that the rule engine correctly implements all specified deterministic logic paths without false alarms on baseline records. They **must not** be described to judges as "real-world field validation accuracy" until prospective validation against unlabelled operational DWLR feeds is completed.

---

## 10. Model Confidence vs. Calibrated Probability

The `modelConfidence` field ($0 - 100\%$) returned by the anomaly engine is an **Empirical Heuristic Consensus Score**. It is formulated as:
$$\text{Confidence} = 0.4 \times \text{QualityScore} + 0.35 \times \text{NeighborAgreementPct} + 0.25 \times \min\left(100, \frac{z_{\text{robust}}}{2.5} \times 100\right)$$

* It **does not** represent a calibrated Bayesian posterior probability $P(\text{Anomaly} \mid \text{Evidence})$.
* The score serves as an operational triage ranking for water resource technicians.
* If sensor quality is $<60$, rainfall is conflicting, or neighbor density $<2$, the engine is explicitly constrained from claiming high confidence and issues an **UNCERTAIN** classification.
