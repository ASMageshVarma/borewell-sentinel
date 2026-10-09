# Borewell Sentinel — Picture-Perfect Prototype

Software-only competition prototype for:

**Borewell Sentinel — Season-Aware AI for Trustworthy Groundwater Anomaly Detection**

This first slice focuses on the visual command center and procedural 3D borewell digital twin. The scene is driven by deterministic mock state so the same demo can be repeated reliably.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Core prototype features

- premium dark groundwater command center
- 3D surface + subsurface aquifer visualisation
- procedural borewell models
- live status coloring: normal / sensor / groundwater / uncertain
- selectable borewells
- water-level trend chart
- rainfall vs groundwater chart
- anomaly classification
- Raw → Trusted → Intelligence pipeline
- quick investigation actions

## Next slices

1. Real Tamil Nadu groundwater + rainfall data ingestion
2. Anomaly engine: temporal + seasonal + spatial + sensor-health evidence
3. True / sensor / uncertain explainability layer
4. Live MQTT/WebSocket seam
5. ESP32 water-level hardware
6. 3D incident replay and time slider
