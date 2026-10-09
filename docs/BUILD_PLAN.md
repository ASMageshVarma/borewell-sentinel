# Borewell Sentinel — Prototype Build Plan

## Slice 1 — Visual Command Center
Complete this starter slice first. Validate the layout against the approved UI references.

## Slice 2 — Data Layer
Replace deterministic mock values with a normalized telemetry model. Start with Tamil Nadu groundwater and rainfall datasets.

## Slice 3 — Anomaly Intelligence
Implement:
- robust temporal anomaly score
- season-aware baseline
- rainfall-response score
- neighbor consistency score
- sensor-health score
- final classification: SENSOR / GROUNDWATER / UNCERTAIN

## Slice 4 — 3D Digital Twin
Extend the current procedural scene with:
- terrain tiles
- groundwater surface
- aquifer layers
- well depth
- animated water-level changes
- anomaly propagation
- historical time slider
- selected-well camera fly-to

## Slice 5 — IoT
Connect ESP32 + safe water-level sensor to MQTT and stream state into the digital twin.

## Slice 6 — Competition Demo
Prepare a deterministic scenario:
1. Normal network
2. Isolated sensor spike
3. Sentinel flags sensor anomaly
4. Multi-well correlated decline
5. Sentinel flags groundwater anomaly
6. Explain evidence
7. Replay the event in 3D
