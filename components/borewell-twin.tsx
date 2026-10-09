'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Float, Html, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import {
  Activity,
  AlertTriangle,
  Compass,
  Crosshair,
  Database,
  Eye,
  Layers,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Play,
  Plus,
  Radio,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Waves,
  Zap,
} from 'lucide-react';
import type { Borewell, BorewellStatus } from '@/lib/data';

export type CameraViewMode = 'COMMAND' | 'WELL_FOCUS' | 'SUBSURFACE' | 'INCIDENT';

const STATUS_COLOR: Record<BorewellStatus, string> = {
  normal: '#35e9b8',
  sensor: '#ffbd3b',
  groundwater: '#ff4c61',
  uncertain: '#9a88ff',
};

const STATUS_LABELS: Record<BorewellStatus, string> = {
  normal: 'Normal',
  sensor: 'Sensor Anomaly',
  groundwater: 'Groundwater Anomaly',
  uncertain: 'Uncertain',
};

// ----------------------------------------------------
// 1. SURFACE TERRAIN WITH ROADS, RIVER, & VEGETATION
// ----------------------------------------------------
function ScientificTerrain({
  surfaceOpacity,
  showSubsurfaceCutaway,
}: {
  surfaceOpacity: number;
  showSubsurfaceCutaway: boolean;
}) {
  // Procedural terrain elevation with lowland river basin
  const { geometry, riverGeo, roadGeo } = useMemo(() => {
    const size = 32;
    const segments = 48;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);

      // Lowland river depression along a gentle diagonal trough
      const riverDist = Math.abs(y - 0.35 * x + 1.2);
      const riverDepression = Math.exp(-Math.pow(riverDist / 2.2, 2)) * 0.95;

      // Natural regional terrain elevation: undulating hills and plains
      const hills =
        0.65 * Math.sin(x * 0.24) +
        0.42 * Math.cos(y * 0.22) +
        0.28 * Math.sin((x + y) * 0.45) +
        0.15 * Math.cos((x - y) * 0.38);

      const z = hills - riverDepression;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    // River water surface ribbon
    const river = new THREE.PlaneGeometry(32, 2.8, 32, 4);

    // Subtle agricultural road line
    const roadPoints = [
      new THREE.Vector3(-15, 2.15, -4),
      new THREE.Vector3(-8, 2.22, -1),
      new THREE.Vector3(0, 2.18, 1.5),
      new THREE.Vector3(8, 2.26, 4.2),
      new THREE.Vector3(15, 2.12, 7),
    ];
    const roadCurve = new THREE.CatmullRomCurve3(roadPoints);
    const road = new THREE.TubeGeometry(roadCurve, 40, 0.16, 6, false);

    return { geometry: geo, riverGeo: river, roadGeo: road };
  }, []);

  // Sparse vegetation / agro-forestry canopies
  const foliageInstances = useMemo(() => {
    const trees: { x: number; z: number; y: number; s: number }[] = [
      { x: -11, z: 6, y: 2.65, s: 0.65 },
      { x: -9.5, z: 7.2, y: 2.7, s: 0.55 },
      { x: -12.2, z: 4.8, y: 2.58, s: 0.7 },
      { x: 10, z: -8, y: 2.62, s: 0.6 },
      { x: 11.5, z: -6.5, y: 2.55, s: 0.72 },
      { x: 8.8, z: -9.2, y: 2.48, s: 0.5 },
      { x: -3.5, z: -8.5, y: 2.38, s: 0.65 },
      { x: -1.8, z: -9.8, y: 2.45, s: 0.58 },
      { x: 11, z: 8.5, y: 2.55, s: 0.62 },
    ];
    return trees;
  }, []);

  return (
    <group position={[0, 2.2, 0]}>
      {/* Primary terrain mesh */}
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#16382e"
          roughness={0.92}
          metalness={0.03}
          transparent={surfaceOpacity < 1 || showSubsurfaceCutaway}
          opacity={showSubsurfaceCutaway ? 0.35 : surfaceOpacity}
        />
      </mesh>

      {/* Lowland water body / river ribbon */}
      <mesh
        geometry={riverGeo}
        rotation={[-Math.PI / 2, 0.32, 0]}
        position={[0, -0.42, -1.2]}
      >
        <meshStandardMaterial
          color="#11596f"
          roughness={0.2}
          metalness={0.3}
          transparent
          opacity={0.78}
        />
      </mesh>

      {/* Subtle rural road network line */}
      <mesh geometry={roadGeo} position={[0, 0.05, 0]}>
        <meshBasicMaterial color="#738a7c" transparent opacity={0.45} />
      </mesh>

      {/* Sparse vegetation clusters */}
      {foliageInstances.map((t, idx) => (
        <group key={idx} position={[t.x, t.y - 2.2 + 0.15, t.z]}>
          <mesh position={[0, 0.22 * t.s, 0]}>
            <coneGeometry args={[0.32 * t.s, 0.75 * t.s, 6]} />
            <meshStandardMaterial
              color="#1f5844"
              roughness={0.9}
              transparent
              opacity={showSubsurfaceCutaway ? 0.25 : surfaceOpacity}
            />
          </mesh>
        </group>
      ))}

      {/* Cross-section outer frame border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(32, 0.05, 32)]} />
        <lineBasicMaterial color="#36d4ff" transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
}

// ----------------------------------------------------
// 2. GEOLOGICAL CROSS-SECTION (5 SCIENTIFIC STRATA)
// ----------------------------------------------------
function GeologicalStrata({
  visible,
  activeAquiferHighlight,
}: {
  visible: boolean;
  activeAquiferHighlight: boolean;
}) {
  if (!visible) return null;

  return (
    <group>
      {/* Layer 1: TOPSOIL & ALLUVIUM (0.0 to -0.6m visual) */}
      <group position={[0, 1.7, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[31.8, 0.5, 31.8]} />
          <meshStandardMaterial
            color="#48382c"
            roughness={0.95}
            transparent
            opacity={0.88}
          />
        </mesh>
      </group>

      {/* Layer 2: WEATHERED ROCK (Saprolite zone: -0.6 to -1.3m visual) */}
      <group position={[0, 1.1, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[31.6, 0.65, 31.6]} />
          <meshStandardMaterial
            color="#53645b"
            roughness={0.85}
            transparent
            opacity={0.78}
          />
        </mesh>
      </group>

      {/* Layer 3: FRACTURED CRACKED BEDROCK (-1.3 to -2.1m visual) */}
      <group position={[0, 0.35, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[31.4, 0.8, 31.4]} />
          <meshStandardMaterial
            color="#334752"
            roughness={0.8}
            transparent
            opacity={0.75}
          />
        </mesh>
      </group>

      {/* Layer 4: PRIMARY SATURATED AQUIFER (-2.1 to -3.2m visual) */}
      <group position={[0, -0.65, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[31.2, 1.15, 31.2]} />
          <meshStandardMaterial
            color="#0d516b"
            roughness={0.35}
            metalness={0.15}
            transparent
            opacity={activeAquiferHighlight ? 0.72 : 0.52}
            emissive="#08384b"
            emissiveIntensity={activeAquiferHighlight ? 1.4 : 0.8}
          />
        </mesh>
      </group>

      {/* Layer 5: IMPERMEABLE HARD ROCK BASEMENT (-3.2 to -4.6m visual) */}
      <group position={[0, -2.1, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[31.0, 1.7, 31.0]} />
          <meshStandardMaterial
            color="#27221d"
            roughness={0.98}
            transparent
            opacity={0.95}
          />
        </mesh>
      </group>
    </group>
  );
}

// ----------------------------------------------------
// 3. CONTINUOUS WATER TABLE SURFACE
// ----------------------------------------------------
function ContinuousWaterTable({
  visible,
  avgWaterDepth,
}: {
  visible: boolean;
  avgWaterDepth: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Subtle undulating water table surface influenced by hydraulic gradient
  const geometry = useMemo(() => {
    const size = 31.2;
    const segments = 36;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const gradient = 0.18 * Math.sin(x * 0.22) + 0.12 * Math.cos(y * 0.28);
      pos.setZ(i, gradient);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = -0.08 + Math.sin(clock.elapsedTime * 0.8) * 0.02;
    }
  });

  if (!visible) return null;

  return (
    <group position={[0, -0.15, 0]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#2dd4ff"
          transparent
          opacity={0.34}
          roughness={0.15}
          metalness={0.3}
          emissive="#1292b8"
          emissiveIntensity={1.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Water table contour lines */}
      <gridHelper
        args={[31.2, 12, '#4ee0ff', '#1a6f8a']}
        position={[0, -0.06, 0]}
      />
    </group>
  );
}

// ----------------------------------------------------
// 4. DIRECTIONAL GROUNDWATER FLOW STREAMLINES
// ----------------------------------------------------
function AquiferFlowLines({ active }: { active: boolean }) {
  const flowTubes = useMemo(() => {
    const streamlines = [
      // Major hydraulic flow line 1 (North-west highland recharge to valley basin)
      [
        [-13, -0.65, -8],
        [-8, -0.72, -5],
        [-3, -0.78, -2],
        [3, -0.85, 1],
        [8, -0.92, 4],
        [13, -0.98, 7],
      ],
      // Secondary flow line 2 (South-west to central extraction cluster)
      [
        [-12, -0.7, 7],
        [-7, -0.75, 5],
        [-2, -0.82, 3],
        [4, -0.88, 2],
        [9, -0.92, 1],
        [13, -0.95, -1],
      ],
      // Flow line 3 (North recharge stream)
      [
        [-6, -0.62, -11],
        [-2, -0.7, -7],
        [2, -0.78, -4],
        [6, -0.84, -1],
        [10, -0.88, 2],
      ],
    ];

    return streamlines.map((pts) => {
      const curve = new THREE.CatmullRomCurve3(
        pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))
      );
      return new THREE.TubeGeometry(curve, 50, 0.055, 6, false);
    });
  }, []);

  if (!active) return null;

  return (
    <group>
      {flowTubes.map((geom, idx) => (
        <mesh key={idx} geometry={geom}>
          <meshBasicMaterial
            color={idx === 0 ? '#38d9ff' : idx === 1 ? '#68f2dc' : '#2ab6ff'}
            transparent
            opacity={0.65}
          />
        </mesh>
      ))}
    </group>
  );
}

// ----------------------------------------------------
// 5. ANOMALY FIELDS & INFLUENCE CONES
// ----------------------------------------------------
function AnomalyInfluenceVolume({
  well,
  selected,
}: {
  well: Borewell;
  selected: boolean;
}) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (pulseRef.current) {
      const s = 1 + Math.sin(t * 2.6) * 0.16;
      pulseRef.current.scale.set(s, s * 0.75, s);
    }
    if (ringRef.current) {
      const s2 = 1 + Math.sin(t * 3.2 + 0.5) * 0.22;
      ringRef.current.scale.set(s2, s2, s2);
    }
  });

  const isGroundwater = well.status === 'groundwater';
  const isSensor = well.status === 'sensor';
  const isUncertain = well.status === 'uncertain';

  if (well.status === 'normal') return null;

  const color = STATUS_COLOR[well.status];

  return (
    <group position={[well.x, 0, well.z]}>
      {/* Groundwater Anomaly: Volumetric Depletion Field in Aquifer */}
      {isGroundwater && (
        <>
          <mesh ref={pulseRef} position={[0, -0.85, 0]}>
            <sphereGeometry args={[2.8, 20, 20]} />
            <meshBasicMaterial
              color="#ff4c61"
              transparent
              opacity={selected ? 0.26 : 0.16}
              wireframe={false}
            />
          </mesh>

          {/* Surrounding spatial drawdown radius ring */}
          <mesh
            ref={ringRef}
            position={[0, -0.65, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[2.6, 2.78, 36]} />
            <meshBasicMaterial color="#ff4c61" transparent opacity={0.65} />
          </mesh>
        </>
      )}

      {/* Sensor Anomaly: Localized hardware warning ring at sensor head */}
      {isSensor && (
        <mesh position={[0, 3.2, 0]}>
          <torusGeometry args={[0.55, 0.05, 12, 36]} />
          <meshBasicMaterial color="#ffbd3b" transparent opacity={0.85} />
        </mesh>
      )}

      {/* Uncertain Context: Subtle diffuse boundary field */}
      {isUncertain && (
        <mesh position={[0, -0.7, 0]}>
          <sphereGeometry args={[1.9, 16, 16]} />
          <meshBasicMaterial
            color="#9a88ff"
            transparent
            opacity={selected ? 0.22 : 0.12}
          />
        </mesh>
      )}
    </group>
  );
}

// ----------------------------------------------------
// 6. NEIGHBOUR RELATIONSHIP LINES & CORRELATIONS
// ----------------------------------------------------
function NeighborRelationshipLines({
  borewells,
  selected,
}: {
  borewells: Borewell[];
  selected: Borewell;
}) {
  const neighbors = useMemo(() => {
    return borewells
      .filter((w) => w.id !== selected.id)
      .map((w) => {
        const dist = Math.hypot(w.x - selected.x, w.z - selected.z);
        return { well: w, dist };
      })
      .filter((item) => item.dist < 13) // within regional cluster boundary
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3);
  }, [borewells, selected]);

  return (
    <group>
      {neighbors.map(({ well, dist }) => {
        // Spatial consistency curve between well surface heads
        const midY = 3.6 + dist * 0.12;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(selected.x, 3.2, selected.z),
          new THREE.Vector3(
            (selected.x + well.x) / 2,
            midY,
            (selected.z + well.z) / 2
          ),
          new THREE.Vector3(well.x, 3.2, well.z),
        ]);

        const agreementRatio = selected.neighboringAgreement / 100;
        const isClusterAnomaly =
          selected.status === 'groundwater' && well.status === 'groundwater';
        const lineColor = isClusterAnomaly
          ? '#ff4c61'
          : selected.status === 'sensor'
          ? '#ffbd3b'
          : '#36d4ff';

        return (
          <group key={well.id}>
            <mesh>
              <tubeGeometry args={[curve, 28, 0.035, 6, false]} />
              <meshBasicMaterial
                color={lineColor}
                transparent
                opacity={0.55}
              />
            </mesh>

            {/* Small mid-point agreement badge in 3D */}
            <Html
              position={[
                (selected.x + well.x) / 2,
                midY + 0.35,
                (selected.z + well.z) / 2,
              ]}
              center
              distanceFactor={14}
              zIndexRange={[10, 0]}
            >
              <div className="neighbor-link-pill">
                <span>{selected.neighboringAgreement}% Agreement</span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// ----------------------------------------------------
// 7. BOREWELL STRUCTURE (CASING, WATER COLUMN, SHAFT)
// ----------------------------------------------------
function BorewellStructure({
  well,
  selected,
  onSelect,
}: {
  well: Borewell;
  selected: boolean;
  onSelect: (well: Borewell) => void;
}) {
  const color = STATUS_COLOR[well.status];

  // Map depth (88m - 152m) to visual shaft length
  const totalShaftHeight = 4.2;
  const shaftTopY = 2.2;
  const shaftBottomY = shaftTopY - totalShaftHeight;

  // Water level in meters (higher value = deeper water table below surface)
  // Water column rises from well bottom up to the water table
  const waterDepthRatio = Math.max(0.15, Math.min(0.85, 1 - well.waterLevel / 22));
  const waterColHeight = Math.max(0.6, totalShaftHeight * waterDepthRatio);
  const waterColY = shaftBottomY + waterColHeight / 2;

  return (
    <group
      position={[well.x, 0, well.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(well);
      }}
    >
      {/* 1. Surface Concrete Pad Marker */}
      <mesh position={[0, 2.25, 0]} receiveShadow>
        <boxGeometry args={[0.9, 0.12, 0.9]} />
        <meshStandardMaterial
          color={selected ? '#ffffff' : '#3d4d54'}
          roughness={0.7}
          metalness={0.2}
          emissive={selected ? color : '#000000'}
          emissiveIntensity={selected ? 0.35 : 0}
        />
      </mesh>

      {/* 2. Above-ground Telemetry Sensor Cap & Antenna */}
      <group position={[0, 2.45, 0]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.65, 20]} />
          <meshStandardMaterial
            color={selected ? '#ffffff' : color}
            emissive={color}
            emissiveIntensity={selected ? 1.6 : 0.75}
            roughness={0.3}
          />
        </mesh>

        {/* Micro Solar Panel hint */}
        <mesh position={[0.22, 0.6, 0]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.25, 0.03, 0.35]} />
          <meshStandardMaterial color="#0b2c3a" roughness={0.2} />
        </mesh>

        {/* LoRa/Cellular Telemetry Antenna */}
        <mesh position={[-0.14, 0.9, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.55, 6]} />
          <meshBasicMaterial color="#a0cfdb" />
        </mesh>
      </group>

      {/* 3. Underground Steel Casing Shaft */}
      <mesh position={[0, shaftTopY - totalShaftHeight / 2, 0]}>
        <cylinderGeometry args={[0.18, 0.18, totalShaftHeight, 20]} />
        <meshStandardMaterial
          color={selected ? '#e6f7fa' : '#8fa4ae'}
          metalness={0.7}
          roughness={0.3}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 4. Active Internal Water Column */}
      <mesh position={[0, waterColY, 0]}>
        <cylinderGeometry args={[0.13, 0.13, waterColHeight, 18]} />
        <meshStandardMaterial
          color="#2ab6ff"
          transparent
          opacity={0.75}
          emissive="#0d6a96"
          emissiveIntensity={selected ? 1.4 : 0.8}
        />
      </mesh>

      {/* 5. Surface Status Glow Ring */}
      <mesh position={[0, 2.27, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry
          args={[
            well.status === 'groundwater'
              ? 1.35
              : well.status === 'sensor'
              ? 1.05
              : 0.8,
            32,
          ]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={selected ? 0.4 : 0.18}
        />
      </mesh>

      {/* 6. Selected Borewell Visual Beacon & Spotlight */}
      {selected && (
        <>
          {/* Vertical light beam pointing down to well */}
          <mesh position={[0, 5.2, 0]}>
            <cylinderGeometry args={[0.04, 0.45, 5.0, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.25} />
          </mesh>

          {/* Glowing beacon orb */}
          <mesh position={[0, 3.4, 0]}>
            <sphereGeometry args={[0.34, 20, 20]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
          </mesh>
        </>
      )}

      {/* 7. Interactive Well Tag Pill */}
      <Float speed={1.2} rotationIntensity={0} floatIntensity={0.25}>
        <Html position={[0, 4.3, 0]} center distanceFactor={11} zIndexRange={[10, 0]}>
          <div
            className={`well-twin-tag ${selected ? 'is-selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(well);
            }}
            style={{
              borderColor: color,
              boxShadow: selected
                ? `0 0 24px ${color}66`
                : `0 4px 16px rgba(0,0,0,0.5)`,
            }}
          >
            <div className="well-tag-id-row">
              <span className="well-tag-id">{well.id}</span>
              <span
                className="well-tag-status-indicator"
                style={{ background: color }}
              />
            </div>
            <div className="well-tag-level">{well.waterLevel.toFixed(1)} m</div>
            <div className="well-tag-status-label" style={{ color }}>
              {STATUS_LABELS[well.status]}
            </div>
          </div>
        </Html>
      </Float>
    </group>
  );
}

// ----------------------------------------------------
// 8. CAMERA CONTROLLER (MODES & CINEMATIC DIVE)
// ----------------------------------------------------
function CinematicCameraController({
  cameraMode,
  selectedWell,
  controlsRef,
  isDiving,
  diveProgress,
}: {
  cameraMode: CameraViewMode;
  selectedWell: Borewell;
  controlsRef: React.RefObject<OrbitControlsImpl>;
  isDiving: boolean;
  diveProgress: number;
}) {
  const { camera } = useThree();

  // Target positions for Camera Modes
  const desired = useMemo(() => {
    const wx = selectedWell.x;
    const wz = selectedWell.z;

    if (isDiving) {
      // Cinematic 7-phase camera trajectory:
      // Command -> Approach -> Subsurface Entry -> Aquifer Dive -> Anomaly Focus
      if (diveProgress < 0.25) {
        // Phase 1: Surface Approach
        const p = diveProgress / 0.25;
        const cx = THREE.MathUtils.lerp(14, wx + 6, p);
        const cy = THREE.MathUtils.lerp(13, 4.5, p);
        const cz = THREE.MathUtils.lerp(17, wz + 7, p);
        const tx = THREE.MathUtils.lerp(0, wx, p);
        const ty = THREE.MathUtils.lerp(0, 2.2, p);
        const tz = THREE.MathUtils.lerp(0, wz, p);
        return { pos: new THREE.Vector3(cx, cy, cz), target: new THREE.Vector3(tx, ty, tz) };
      } else if (diveProgress < 0.55) {
        // Phase 2: Subsurface Entry & Geological Layers
        const p = (diveProgress - 0.25) / 0.3;
        const cx = THREE.MathUtils.lerp(wx + 6, wx + 4.8, p);
        const cy = THREE.MathUtils.lerp(4.5, -0.4, p);
        const cz = THREE.MathUtils.lerp(wz + 7, wz + 5.2, p);
        const tx = wx;
        const ty = THREE.MathUtils.lerp(2.2, -0.2, p);
        const tz = wz;
        return { pos: new THREE.Vector3(cx, cy, cz), target: new THREE.Vector3(tx, ty, tz) };
      } else if (diveProgress < 0.8) {
        // Phase 3: Aquifer & Water Table Inspection
        const p = (diveProgress - 0.55) / 0.25;
        const cx = THREE.MathUtils.lerp(wx + 4.8, wx + 3.8, p);
        const cy = THREE.MathUtils.lerp(-0.4, -0.9, p);
        const cz = THREE.MathUtils.lerp(wz + 5.2, wz + 4.2, p);
        const tx = wx;
        const ty = THREE.MathUtils.lerp(-0.2, -0.8, p);
        const tz = wz;
        return { pos: new THREE.Vector3(cx, cy, cz), target: new THREE.Vector3(tx, ty, tz) };
      } else {
        // Phase 4: Settle on Anomaly & Neighbor Evidence
        const p = (diveProgress - 0.8) / 0.2;
        const cx = THREE.MathUtils.lerp(wx + 3.8, wx + 4.6, p);
        const cy = THREE.MathUtils.lerp(-0.9, -0.6, p);
        const cz = THREE.MathUtils.lerp(wz + 4.2, wz + 5.4, p);
        const tx = wx;
        const ty = -0.7;
        const tz = wz;
        return { pos: new THREE.Vector3(cx, cy, cz), target: new THREE.Vector3(tx, ty, tz) };
      }
    }

    switch (cameraMode) {
      case 'COMMAND':
        return {
          pos: new THREE.Vector3(14, 13, 17),
          target: new THREE.Vector3(0, 0, 0),
        };
      case 'WELL_FOCUS':
        return {
          pos: new THREE.Vector3(wx + 5.2, 5.0, wz + 6.0),
          target: new THREE.Vector3(wx, 2.2, wz),
        };
      case 'SUBSURFACE':
        return {
          pos: new THREE.Vector3(wx + 5.5, -0.7, wz + 5.8),
          target: new THREE.Vector3(wx, -0.85, wz),
        };
      case 'INCIDENT':
        return {
          pos: new THREE.Vector3(wx + 4.8, 1.8, wz + 6.2),
          target: new THREE.Vector3(wx, -0.3, wz),
        };
    }
  }, [cameraMode, selectedWell, isDiving, diveProgress]);

  useFrame((_, delta) => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const lerpSpeed = isDiving ? 4.5 * delta : 3.2 * delta;

      camera.position.lerp(desired.pos, Math.min(1, lerpSpeed));
      controls.target.lerp(desired.target, Math.min(1, lerpSpeed));
      controls.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={6}
      maxDistance={38}
      maxPolarAngle={Math.PI / 2 + 0.1} // allow looking from slightly below the horizon into the strata
    />
  );
}

// ----------------------------------------------------
// 9. MAIN COMPONENT EXPORT: BOREWELL TWIN
// ----------------------------------------------------
export function BorewellTwin({
  borewells,
  selectedId,
  onSelect,
}: {
  borewells: Borewell[];
  selectedId: string;
  onSelect: (well: Borewell) => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // View state & layer toggles
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('COMMAND');
  const [viewScope, setViewScope] = useState<'SURFACE' | 'SUBSURFACE' | 'CUTAWAY'>('CUTAWAY');
  const [showWaterTable, setShowWaterTable] = useState<boolean>(true);
  const [showGeology, setShowGeology] = useState<boolean>(true);
  const [showAnomalyFields, setShowAnomalyFields] = useState<boolean>(true);
  const [showFlowLines, setShowFlowLines] = useState<boolean>(true);

  // Cinematic Dive progression
  const [isDiving, setIsDiving] = useState<boolean>(false);
  const [diveProgress, setDiveProgress] = useState<number>(0);

  const selectedWell = useMemo(() => {
    return borewells.find((w) => w.id === selectedId) ?? borewells[0];
  }, [borewells, selectedId]);

  // Average regional water level
  const avgWaterDepth = useMemo(() => {
    const sum = borewells.reduce((acc, b) => acc + b.waterLevel, 0);
    return sum / borewells.length;
  }, [borewells]);

  // Cinematic Camera Dive animation loop
  useEffect(() => {
    if (!isDiving) return;

    let startTime = performance.now();
    const duration = 6500; // 6.5s cinematic sequence

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);
      setDiveProgress(p);

      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        setIsDiving(false);
        setCameraMode('SUBSURFACE');
      }
    };

    const animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isDiving]);

  const startCameraDive = () => {
    setIsDiving(true);
    setDiveProgress(0);
    setViewScope('CUTAWAY');
    setShowWaterTable(true);
    setShowGeology(true);
  };

  const handleZoomIn = () => {
    if (controlsRef.current) {
      controlsRef.current.object.position.multiplyScalar(0.85);
      controlsRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      controlsRef.current.object.position.multiplyScalar(1.15);
      controlsRef.current.update();
    }
  };

  const handleResetCamera = () => {
    setIsDiving(false);
    setCameraMode('COMMAND');
    if (controlsRef.current) {
      controlsRef.current.object.position.set(14, 13, 17);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const handleFocusSelected = () => {
    setIsDiving(false);
    setCameraMode('WELL_FOCUS');
  };

  return (
    <div className="twin-shell">
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[14, 13, 17]} fov={38} />

        {/* Ambient & Directional Environmental Lighting */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[7, 20, 10]}
          intensity={2.0}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        {/* Aquifer glow lighting */}
        <pointLight position={[-8, 7, 5]} intensity={45} distance={32} color="#2dd4ff" />
        <pointLight position={[9, -0.8, -3]} intensity={38} distance={25} color="#1ebc9b" />
        <pointLight position={[0, -2.5, 0]} intensity={25} distance={20} color="#084a60" />

        <color attach="background" args={['#02090e']} />

        <group>
          {/* 1. Procedural Scientific Terrain */}
          <ScientificTerrain
            surfaceOpacity={viewScope === 'SUBSURFACE' ? 0.18 : 1.0}
            showSubsurfaceCutaway={viewScope === 'CUTAWAY'}
          />

          {/* 2. 5-Layer Geological Cross-Section */}
          <GeologicalStrata
            visible={showGeology}
            activeAquiferHighlight={cameraMode === 'SUBSURFACE' || cameraMode === 'INCIDENT'}
          />

          {/* 3. Continuous Regional Water Table */}
          <ContinuousWaterTable
            visible={showWaterTable}
            avgWaterDepth={avgWaterDepth}
          />

          {/* 4. Directional Aquifer Groundwater Flowlines */}
          <AquiferFlowLines active={showFlowLines} />

          {/* 5. Borewell Structures & Telemetry */}
          {borewells.map((well) => (
            <BorewellStructure
              key={well.id}
              well={well}
              selected={selectedId === well.id}
              onSelect={onSelect}
            />
          ))}

          {/* 6. Anomaly Influence Volume Cones */}
          {showAnomalyFields &&
            borewells.map((well) => (
              <AnomalyInfluenceVolume
                key={`anomaly-${well.id}`}
                well={well}
                selected={selectedId === well.id}
              />
            ))}

          {/* 7. Neighbor Relationship Lines for Selected Well */}
          <NeighborRelationshipLines
            borewells={borewells}
            selected={selectedWell}
          />
        </group>

        <ContactShadows position={[0, -0.05, 0]} opacity={0.42} scale={34} blur={2.3} far={12} />

        <CinematicCameraController
          cameraMode={cameraMode}
          selectedWell={selectedWell}
          controlsRef={controlsRef}
          isDiving={isDiving}
          diveProgress={diveProgress}
        />
      </Canvas>

      {/* ---------------- Viewport Top Overlay ---------------- */}
      <div className="twin-top-controls-bar">
        {/* Layer Scope Toggles */}
        <div className="twin-pill-group">
          <button
            className={`twin-chip-btn ${viewScope === 'SURFACE' ? 'active' : ''}`}
            onClick={() => setViewScope('SURFACE')}
            title="Surface Landscape View"
          >
            <span className="twin-chip-dot green" /> Surface
          </button>
          <button
            className={`twin-chip-btn ${viewScope === 'SUBSURFACE' ? 'active' : ''}`}
            onClick={() => setViewScope('SUBSURFACE')}
            title="Subsurface Aquifer Focus"
          >
            <span className="twin-chip-dot blue" /> Subsurface
          </button>
          <button
            className={`twin-chip-btn ${viewScope === 'CUTAWAY' ? 'active' : ''}`}
            onClick={() => setViewScope('CUTAWAY')}
            title="Geological Strata Cutaway"
          >
            <span className="twin-chip-dot cyan" /> Cutaway
          </button>
        </div>

        {/* Feature Switches */}
        <div className="twin-pill-group">
          <button
            className={`twin-chip-btn ${showWaterTable ? 'active' : ''}`}
            onClick={() => setShowWaterTable(!showWaterTable)}
            title="Toggle Continuous Water Table Plane"
          >
            <Waves size={12} /> Water Table
          </button>
          <button
            className={`twin-chip-btn ${showGeology ? 'active' : ''}`}
            onClick={() => setShowGeology(!showGeology)}
            title="Toggle 5-Layer Geological Cross-Section"
          >
            <Layers size={12} /> Geology Strata
          </button>
          <button
            className={`twin-chip-btn ${showAnomalyFields ? 'active' : ''}`}
            onClick={() => setShowAnomalyFields(!showAnomalyFields)}
            title="Toggle Anomaly Field Cones"
          >
            <AlertTriangle size={12} /> Anomaly Field
          </button>
        </div>

        {/* Camera Modes & Dive */}
        <div className="twin-pill-group camera-modes-group">
          <button
            className={`twin-chip-btn ${cameraMode === 'COMMAND' && !isDiving ? 'active' : ''}`}
            onClick={() => {
              setIsDiving(false);
              setCameraMode('COMMAND');
            }}
          >
            Command View
          </button>
          <button
            className={`twin-chip-btn ${cameraMode === 'WELL_FOCUS' && !isDiving ? 'active' : ''}`}
            onClick={handleFocusSelected}
          >
            Well Focus
          </button>
          <button
            className={`twin-chip-btn ${cameraMode === 'SUBSURFACE' && !isDiving ? 'active' : ''}`}
            onClick={() => {
              setIsDiving(false);
              setCameraMode('SUBSURFACE');
            }}
          >
            Subsurface
          </button>
          <button
            className={`twin-chip-btn ${cameraMode === 'INCIDENT' && !isDiving ? 'active' : ''}`}
            onClick={() => {
              setIsDiving(false);
              setCameraMode('INCIDENT');
            }}
          >
            Incident
          </button>

          {/* Cinematic Camera Dive Button */}
          <button
            className={`twin-chip-btn dive-btn ${isDiving ? 'diving' : ''}`}
            onClick={startCameraDive}
            title="Execute cinematic dive from command to aquifer"
          >
            <Play size={11} className={isDiving ? 'spin' : ''} />
            <span>{isDiving ? `Diving ${Math.round(diveProgress * 100)}%` : 'Camera Dive'}</span>
          </button>
        </div>
      </div>

      {/* ---------------- Viewport Top-Right Navigation Icons ---------------- */}
      <div className="twin-viewport-controls">
        <div className="compass-badge" title="Orientation (North)">
          <Compass size={14} />
          <span>N</span>
        </div>
        <button className="control-btn" onClick={handleZoomIn} title="Zoom In">
          <Plus size={15} />
        </button>
        <button className="control-btn" onClick={handleZoomOut} title="Zoom Out">
          <Minus size={15} />
        </button>
        <button className="control-btn" onClick={handleFocusSelected} title="Center on Selected Well">
          <Crosshair size={14} />
        </button>
        <button className="control-btn" onClick={handleResetCamera} title="Reset to Command View">
          <RotateCcw size={14} />
        </button>
      </div>

      {/* ---------------- Bottom Left Strata Scale & Scientific Disclaimer ---------------- */}
      <div className="twin-strata-legend">
        <div className="strata-title">GEOLOGICAL STRATA CROSS-SECTION</div>
        <div className="strata-scale">
          <div className="strata-step topsoil"><span>0m</span> Topsoil & Alluvium</div>
          <div className="strata-step weathered"><span>-6m</span> Weathered Rock (Saprolite)</div>
          <div className="strata-step fractured"><span>-15m</span> Fractured Aquifer Zone</div>
          <div className="strata-step saturated"><span>-28m</span> Regional Saturated Aquifer</div>
          <div className="strata-step basement"><span>-45m</span> Crystalline Bedrock</div>
        </div>
        <div className="disclaimer-text">
          Prototype model assessment • Simulation evidence
        </div>
      </div>

      {/* ---------------- Bottom Right Status Legend ---------------- */}
      <div className="twin-overlay-legend">
        <div className="legend-row">
          <span className="legend-dot green" />
          <span>Normal (Stable)</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot yellow" />
          <span>Sensor Anomaly</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot red" />
          <span>Groundwater Depletion</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot purple" />
          <span>Uncertain Context</span>
        </div>
        <div className="legend-divider" />
        <div className="legend-row neighbor-legend">
          <span className="neighbor-line-indicator" />
          <span>Neighbor Relationship</span>
        </div>
      </div>
    </div>
  );
}
