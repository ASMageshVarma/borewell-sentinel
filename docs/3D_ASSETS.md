# Borewell Sentinel — 3D Asset Plan

The first prototype uses procedural Three.js geometry rather than downloaded models. This keeps the prototype self-contained, editable, fast, and safe to demonstrate.

## Borewell model

Components:
- steel/concrete casing cylinder
- inner water column
- sensor cap
- surface base ring
- depth indicator
- status emissive material

## Status visualization

NORMAL:
- teal sensor head
- subtle teal base ring

SENSOR ANOMALY:
- amber sensor head
- pulsing amber ring
- warning label

GROUNDWATER ANOMALY:
- red sensor head
- larger red ground ring
- animated pulse
- anomaly label

UNCERTAIN:
- purple sensor head
- soft purple ring

## Subsurface model

The prototype scene contains:
1. terrain surface
2. weathered-rock layer
3. aquifer layer
4. water-table plane
5. groundwater flow lines

## Future assets

Later, replace or augment procedural geometry with:
- higher-detail terrain tiles
- district boundaries
- aquifer boundary meshes
- borewell inspection imagery
- sensor equipment GLB models
- particle-based anomaly propagation
- historical water-table surfaces

Keep asset scale consistent. 1 world unit should represent approximately 10 metres in the visualization layer, while displaying actual values in metres in the UI.
