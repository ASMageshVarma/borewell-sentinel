'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Battery,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CloudRain,
  Compass,
  Cpu,
  Database,
  Droplets,
  ExternalLink,
  FileText,
  Filter,
  Gauge,
  HelpCircle,
  Home,
  Info,
  Layers,
  Layers3,
  MapPin,
  Radio,
  RadioTower,
  RefreshCw,
  Search,
  Settings,
  Share2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Waves,
  Zap,
} from 'lucide-react';
import { borewells as demoBorewells } from '@/lib/data';
import type { Borewell, BorewellStatus } from '@/lib/data';
import { getProcessedResearchBorewells, convertResearchToBorewell } from '@/lib/ingestion';
import type { ResearchBorewell } from '@/lib/schema';
import { BorewellTwin } from './borewell-twin';
import { AnomalyClassificationDonut, Mini7DayTrendChart, RainfallChart, WaterTrendChart } from './charts';
import { ExplainabilityModal } from './explainability-modal';

export type OperatingMode = 'DEMO' | 'RESEARCH';

const statusMeta: Record<BorewellStatus, { label: string; color: string; className: string }> = {
  normal: { label: 'Normal', color: '#35e9b8', className: 'normal' },
  sensor: { label: 'Sensor Anomaly', color: '#ffbd3b', className: 'sensor' },
  groundwater: { label: 'Groundwater Anomaly', color: '#ff4c61', className: 'groundwater' },
  uncertain: { label: 'Uncertain', color: '#9a88ff', className: 'uncertain' },
};

function Badge({ status }: { status: BorewellStatus }) {
  const s = statusMeta[status];
  return (
    <span className={`status-badge ${s.className}`}>
      <span className="status-dot" />
      {s.label}
    </span>
  );
}

export default function BorewellDashboard() {
  // Operating Mode: DEMO vs RESEARCH
  const [operatingMode, setOperatingMode] = useState<OperatingMode>('DEMO');
  const [selectedId, setSelectedId] = useState('BW-05');
  const [range] = useState('01 Apr 2026 — 31 Oct 2026');
  const [activeTab, setActiveTab] = useState<'home' | '3d' | 'analytics' | 'anomalies' | 'reports'>('home');
  const [isExplainModalOpen, setIsExplainModalOpen] = useState<boolean>(false);

  // Ingested Real Research dataset
  const researchBorewellsList = useMemo(() => getProcessedResearchBorewells(), []);
  const convertedResearchBorewells = useMemo(
    () => researchBorewellsList.map(convertResearchToBorewell),
    [researchBorewellsList]
  );

  // Active dataset depending on mode
  const activeBorewells = useMemo(() => {
    return operatingMode === 'DEMO' ? demoBorewells : convertedResearchBorewells;
  }, [operatingMode, convertedResearchBorewells]);

  // Selected Borewell instance
  const selected = useMemo(() => {
    return activeBorewells.find((x) => x.id === selectedId) ?? activeBorewells[0];
  }, [activeBorewells, selectedId]);

  // Associated research item if in research mode
  const activeResearchItem: ResearchBorewell | undefined = useMemo(() => {
    if (operatingMode === 'RESEARCH') {
      return researchBorewellsList.find((r) => r.id === selected.id);
    }
    return undefined;
  }, [operatingMode, researchBorewellsList, selected.id]);

  const normal = activeBorewells.filter((x) => x.status === 'normal').length;
  const sensor = activeBorewells.filter((x) => x.status === 'sensor').length;
  const groundwater = activeBorewells.filter((x) => x.status === 'groundwater').length;
  const uncertain = activeBorewells.filter((x) => x.status === 'uncertain').length;

  // Mode switcher handler
  const handleSwitchMode = (mode: OperatingMode) => {
    setOperatingMode(mode);
    if (mode === 'DEMO') {
      setSelectedId('BW-05');
    } else {
      setSelectedId('TN-NK-05');
    }
  };

  // Alert Items dynamically reflecting mode
  const alertItems = useMemo(() => {
    if (operatingMode === 'RESEARCH') {
      return [
        {
          id: 'TN-NK-05',
          status: 'groundwater' as const,
          title: 'Coordinated groundwater depletion in Namakkal overdraft basin',
          meta: '2.8 m drop • 86% neighbor agreement • verified sensor quality',
          time: 'Today, 14:32',
        },
        {
          id: 'TN-SL-04',
          status: 'sensor' as const,
          title: 'Transducer step anomaly detected (Salem Omalur DWLR)',
          meta: 'Isolated spike to 18.4 m • low neighbor consensus (34%)',
          time: 'Today, 11:17',
        },
        {
          id: 'TN-KR-07',
          status: 'sensor' as const,
          title: 'High-frequency telemetry noise with voltage degradation',
          meta: 'Battery voltage 3.22V • low spatial coherence in Karur',
          time: 'Today, 09:03',
        },
        {
          id: 'TN-MD-12',
          status: 'uncertain' as const,
          title: 'Unassimilated rainfall contradiction in Madurai Vaigai basin',
          meta: 'Drawdown recorded during cloudburst window; awaiting cycle',
          time: 'Today, 07:45',
        },
        {
          id: 'TN-CW-01',
          status: 'normal' as const,
          title: 'Coimbatore regional observation well stable',
          meta: 'Adheres to expected seasonal baseline in weathered charnockite',
          time: 'Yesterday, 18:45',
        },
      ];
    }

    return [
      {
        id: 'BW-05',
        status: 'groundwater' as const,
        title: 'Water level dropped by 2.8 m (significant change)',
        meta: 'Coordinated decline across Namakkal cluster • 86% agreement',
        time: 'Today, 14:32',
      },
      {
        id: 'BW-04',
        status: 'sensor' as const,
        title: 'Sudden spike in reading (likely sensor issue)',
        meta: 'Isolated jump to 18.4 m without rainfall • 34% neighbor agreement',
        time: 'Today, 11:17',
      },
      {
        id: 'BW-07',
        status: 'sensor' as const,
        title: 'Irregular telemetry pattern detected',
        meta: 'High-frequency noise & low battery voltage flagged (Karur)',
        time: 'Today, 09:03',
      },
      {
        id: 'BW-12',
        status: 'uncertain' as const,
        title: 'Context insufficient for attribution',
        meta: 'Moderate decline but contradictory local rain; awaiting assimilation',
        time: 'Today, 07:45',
      },
      {
        id: 'BW-01',
        status: 'normal' as const,
        title: 'Water level stabilized after recharge',
        meta: 'Coimbatore well returned to expected seasonal bounds',
        time: 'Yesterday, 18:45',
      },
    ];
  }, [operatingMode]);

  return (
    <main className="app-shell">
      {/* Top Header */}
      <header className="topbar">
        <div className="brand-group">
          <div className="brand-mark">
            <Droplets size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div className="brand-name">Borewell Sentinel</div>
            <div className="brand-sub">GROUNDWATER INTELLIGENCE SYSTEM</div>
          </div>
        </div>

        {/* Operating Mode Switcher */}
        <div className="mode-toggle-group">
          <button
            className={`mode-btn ${operatingMode === 'DEMO' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('DEMO')}
            title="Deterministic Demonstration Mode (Offline)"
          >
            <Sparkles size={13} />
            <span>DEMO MODE</span>
          </button>
          <button
            className={`mode-btn ${operatingMode === 'RESEARCH' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('RESEARCH')}
            title="Real CGWB & WRIS Telemetry Analysis Mode"
          >
            <Database size={13} />
            <span>RESEARCH MODE (REAL DATA)</span>
          </button>
        </div>

        <div className="header-context">
          <button className="context-btn" title="Region filter">
            <MapPin size={15} />
            <span>Tamil Nadu</span>
            <ChevronDown size={14} />
          </button>
          <button className="context-btn" title="Date range">
            <CalendarDays size={15} />
            <span>{range}</span>
          </button>
        </div>

        <div className="header-right">
          <div className="weather">
            <CloudRain size={18} />
            <div>
              <div className="weather-temp">28°C</div>
              <div className="weather-text">Partly Cloudy</div>
            </div>
          </div>
          <div className="live-pill">
            <span className="live-dot" />{' '}
            {operatingMode === 'DEMO' ? 'LIVE SIMULATION' : 'RESEARCH REAL-TIME'}
          </div>
          <button className="icon-btn" title="Notifications">
            <Bell size={17} />
          </button>
          <div className="user-profile">
            <div className="avatar">AT</div>
            <div className="user-info">
              <span className="user-name">Team Alpha</span>
              <ChevronDown size={12} />
            </div>
          </div>
        </div>
      </header>

      <div className="body-grid">
        {/* Left Navigation Sidebar */}
        <aside className="sidebar">
          <div className="nav-section-label">MONITORING</div>
          <nav>
            <button
              className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <Home size={17} /> Command Center
            </button>
            <button
              className={`nav-item ${activeTab === '3d' ? 'active' : ''}`}
              onClick={() => setActiveTab('3d')}
            >
              <Layers3 size={17} /> 3D Digital Twin
            </button>
            <button
              className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <Activity size={17} /> Analytics & Trends
            </button>
            <button
              className={`nav-item ${activeTab === 'anomalies' ? 'active' : ''}`}
              onClick={() => setActiveTab('anomalies')}
            >
              <AlertTriangle size={17} /> Anomaly Engine
            </button>
            <button
              className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <FileText size={17} /> Alerts & Reports
            </button>
          </nav>

          <div className="nav-divider" />
          <div className="nav-section-label">SYSTEM</div>
          <button className="nav-item">
            <Settings size={17} /> Settings & Telemetry
          </button>

          <div className="sidebar-bottom">
            <div className="leaf-emblem">
              <Waves size={18} />
            </div>
            <div>
              <div className="sidebar-foot-title">Clean Water</div>
              <div className="sidebar-foot-sub">Sustainable Future</div>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <section className="workspace">
          {/* Research Mode Provenance Banner */}
          {operatingMode === 'RESEARCH' && (
            <div className="research-mode-banner">
              <div className="banner-badge">
                <Database size={13} /> RESEARCH MODE — REAL DATA
              </div>
              <div className="banner-provenance">
                <strong>Data Source:</strong> CGWB / WRIS Tamil Nadu Groundwater Telemetry Network
                (v2026.04) • IMD Gridded Rainfall Dataset
              </div>
              <button
                className="banner-action-btn"
                onClick={() => setIsExplainModalOpen(true)}
              >
                <Info size={13} /> View Model Methodology
              </button>
            </div>
          )}

          {/* Hero Banner & Scenario / Station Bar */}
          <div className="hero-strip">
            <div>
              <div className="eyebrow">
                {operatingMode === 'DEMO'
                  ? 'GROUNDWATER COMMAND CENTER'
                  : 'HYDROGEOLOGICAL RESEARCH PLATFORM'}
              </div>
              <h1>
                {operatingMode === 'DEMO'
                  ? 'Borewell Network Intelligence'
                  : 'Tamil Nadu Groundwater Telemetry Network'}
              </h1>
              <p>Season-aware monitoring • interpretable anomaly attribution • trusted data quality</p>
            </div>

            {/* Quick Selector: Scenarios in DEMO mode, Stations in RESEARCH mode */}
            <div className="scenario-buttons">
              <span className="scenario-label">
                {operatingMode === 'DEMO' ? 'QUICK SCENARIOS:' : 'STATION FOCUS:'}
              </span>

              {operatingMode === 'DEMO' ? (
                <>
                  <button
                    className={`scenario-chip ${selectedId === 'BW-01' ? 'active' : ''}`}
                    onClick={() => setSelectedId('BW-01')}
                    title="Scenario A: Stable seasonal baseline"
                  >
                    <span className="legend-dot green" /> A: Normal (BW-01)
                  </button>
                  <button
                    className={`scenario-chip ${selectedId === 'BW-04' ? 'active' : ''}`}
                    onClick={() => setSelectedId('BW-04')}
                    title="Scenario B: Isolated sensor spike"
                  >
                    <span className="legend-dot yellow" /> B: Sensor Spike (BW-04)
                  </button>
                  <button
                    className={`scenario-chip ${selectedId === 'BW-05' ? 'active' : ''}`}
                    onClick={() => setSelectedId('BW-05')}
                    title="Scenario C: Multi-well persistent groundwater drop"
                  >
                    <span className="legend-dot red" /> C: True Depletion (BW-05)
                  </button>
                  <button
                    className={`scenario-chip ${selectedId === 'BW-12' ? 'active' : ''}`}
                    onClick={() => setSelectedId('BW-12')}
                    title="Scenario D: Ambiguous spatial context"
                  >
                    <span className="legend-dot purple" /> D: Uncertain (BW-12)
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={`scenario-chip ${selectedId === 'TN-CW-01' ? 'active' : ''}`}
                    onClick={() => setSelectedId('TN-CW-01')}
                    title="Coimbatore observation well (Normal)"
                  >
                    <span className="legend-dot green" /> TN-CW-01 (Normal)
                  </button>
                  <button
                    className={`scenario-chip ${selectedId === 'TN-SL-04' ? 'active' : ''}`}
                    onClick={() => setSelectedId('TN-SL-04')}
                    title="Salem DWLR (Sensor Anomaly)"
                  >
                    <span className="legend-dot yellow" /> TN-SL-04 (Sensor)
                  </button>
                  <button
                    className={`scenario-chip ${selectedId === 'TN-NK-05' ? 'active' : ''}`}
                    onClick={() => setSelectedId('TN-NK-05')}
                    title="Namakkal Overdraft Well (Groundwater Anomaly)"
                  >
                    <span className="legend-dot red" /> TN-NK-05 (Groundwater)
                  </button>
                  <button
                    className={`scenario-chip ${selectedId === 'TN-MD-12' ? 'active' : ''}`}
                    onClick={() => setSelectedId('TN-MD-12')}
                    title="Madurai Vaigai Well (Uncertain Context)"
                  >
                    <span className="legend-dot purple" /> TN-MD-12 (Uncertain)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* KPI Summary Strip */}
          <div className="kpi-grid">
            <KpiCard
              icon={<Droplets size={19} />}
              label="Total Borewells"
              value={activeBorewells.length}
              meta="+2 added"
              tone="cyan"
              sub={operatingMode === 'DEMO' ? 'Tamil Nadu Network' : 'CGWB Telemetry Stations'}
            />
            <KpiCard
              icon={<ShieldCheck size={19} />}
              label="Normal"
              value={normal}
              meta={`${((normal / activeBorewells.length) * 100).toFixed(0)}% network`}
              tone="green"
              sub="Stable Aquifer"
            />
            <KpiCard
              icon={<AlertTriangle size={19} />}
              label="Sensor Anomalies"
              value={sensor}
              meta="2 flagged"
              tone="yellow"
              sub="Hardware / Noise"
            />
            <KpiCard
              icon={<Waves size={19} />}
              label="Groundwater Anomalies"
              value={groundwater}
              meta="Priority action"
              tone="red"
              sub="Likely Depletion"
            />
            <KpiCard
              icon={<Gauge size={19} />}
              label="Uncertain"
              value={uncertain}
              meta="1 under review"
              tone="purple"
              sub="Insufficient Evidence"
            />
          </div>

          {/* Main Hero Grid: 3D Twin & Latest Alerts */}
          <div className="main-grid">
            {/* Center Hero: 3D Borewell Digital Twin */}
            <div className="panel twin-panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">
                    <Layers3 size={16} /> 3D View — Borewell Network
                  </div>
                  <div className="panel-sub">
                    Surface terrain + subsurface aquifer layers + live well status
                  </div>
                </div>
                <div className="panel-head-actions">
                  <div className="well-selector-dropdown">
                    <span className="selector-prefix">FOCUS:</span>
                    <select
                      value={selectedId}
                      onChange={(e) => setSelectedId(e.target.value)}
                      className="well-dropdown-select"
                    >
                      {activeBorewells.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.id} ({b.district} - {statusMeta[b.status].label})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="tiny-btn" title="Toggle layer filters">
                    <Filter size={14} /> Filter
                  </button>
                  <button className="tiny-btn" title="Subsurface strata layers">
                    <SlidersHorizontal size={14} /> Layers
                  </button>
                </div>
              </div>
              <BorewellTwin
                borewells={activeBorewells}
                selectedId={selectedId}
                onSelect={(well) => setSelectedId(well.id)}
              />
            </div>

            {/* Right Column: Latest Alerts */}
            <div className="panel alert-panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">
                    <Bell size={16} /> Latest Alerts
                  </div>
                  <div className="panel-sub">
                    {operatingMode === 'DEMO'
                      ? 'Prioritized events across Tamil Nadu'
                      : 'Assimilated events from CGWB telemetry'}
                  </div>
                </div>
                <button
                  className="link-btn explain-btn-top"
                  onClick={() => setIsExplainModalOpen(true)}
                  title="Open Explainability Deep Dive"
                >
                  <Sparkles size={13} /> WHY?
                </button>
              </div>

              <div className="alert-list">
                {alertItems.map((a) => {
                  const isCurrent = a.id === selectedId;
                  return (
                    <button
                      key={a.id}
                      className={`alert-row ${a.status} ${isCurrent ? 'active-alert' : ''}`}
                      onClick={() => setSelectedId(a.id)}
                    >
                      <div className={`alert-icon ${a.status}`}>
                        {a.status === 'groundwater' ? (
                          <Waves size={15} />
                        ) : a.status === 'sensor' ? (
                          <AlertTriangle size={15} />
                        ) : a.status === 'uncertain' ? (
                          <HelpCircle size={15} />
                        ) : (
                          <ShieldCheck size={15} />
                        )}
                      </div>
                      <div className="alert-copy">
                        <div className="alert-top">
                          <strong>{a.id}</strong>
                          <span className="alert-district-sep">•</span>
                          <span className="alert-district-name">
                            {activeBorewells.find((w) => w.id === a.id)?.district}
                          </span>
                          <Badge status={a.status} />
                        </div>
                        <div className="alert-title">{a.title}</div>
                        <div className="alert-meta">{a.meta}</div>
                      </div>
                      <div className="alert-time">{a.time}</div>
                    </button>
                  );
                })}
              </div>

              {/* Status summary banner at bottom of alerts */}
              <div className="alert-footer-summary">
                <span className="pulse-indicator" />
                <span>Season-Aware Anomaly Engine active • 8 nodes synced</span>
              </div>
            </div>
          </div>

          {/* Analytics Row: 3 Visual Panels */}
          <div className="analytics-grid">
            {/* 1. Water Level Trend */}
            <div className="panel chart-panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">
                    Water Level Trend — {selected.id}{' '}
                    <span
                      className="title-status-tag"
                      style={{ color: statusMeta[selected.status].color }}
                    >
                      ({statusMeta[selected.status].label})
                    </span>
                  </div>
                  <div className="panel-sub">
                    Actual level against expected seasonal baseline (Tamil Nadu hydrologic model)
                  </div>
                </div>
                <div className="chart-head-actions">
                  <Badge status={selected.status} />
                  <button
                    className="why-chip-btn"
                    onClick={() => setIsExplainModalOpen(true)}
                    title="Explain Anomaly Attribution"
                  >
                    <Info size={12} /> WHY?
                  </button>
                </div>
              </div>
              <WaterTrendChart selected={selected} />
            </div>

            {/* 2. Rainfall vs Groundwater */}
            <div className="panel chart-panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Rainfall vs Groundwater Level</div>
                  <div className="panel-sub">
                    {operatingMode === 'DEMO'
                      ? 'Seasonal monsoon correlation context'
                      : 'IMD Gridded Rainfall vs CGWB Telemetry'}
                  </div>
                </div>
                <div className="chart-legend-top">
                  <span>
                    <i className="legend-square blue" /> Rainfall (mm)
                  </span>
                  <span>
                    <i className="legend-line green" /> Groundwater (m)
                  </span>
                </div>
              </div>
              <RainfallChart />
            </div>

            {/* 3. Anomaly Classification Donut */}
            <div className="panel classification-panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Anomaly Classification</div>
                  <div className="panel-sub">Attribution distribution across network</div>
                </div>
              </div>
              <AnomalyClassificationDonut
                normal={normal}
                sensor={sensor}
                groundwater={groundwater}
                uncertain={uncertain}
              />
            </div>
          </div>

          {/* Bottom Row: Selected Borewell Details & Pipeline + Quick Actions */}
          <div className="bottom-grid">
            {/* Selected Borewell Details */}
            <div className="panel borewell-details-panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">
                    <RadioTower size={16} /> Borewell Details — {selected.id}
                  </div>
                  <div className="panel-sub">
                    Hydrogeological telemetry & real-time diagnostic parameters
                  </div>
                </div>
                <div className="header-chips-row">
                  <span className="station-type-chip">{selected.stationType}</span>
                  <Badge status={selected.status} />
                  <button
                    className="why-chip-btn primary"
                    onClick={() => setIsExplainModalOpen(true)}
                    title="Open Anomaly Evidence & Explainability Modal"
                  >
                    <Sparkles size={12} /> Explain Anomaly
                  </button>
                </div>
              </div>

              <div className="details-body">
                {/* Station Visual Card */}
                <div className="station-visual-card">
                  <div className="station-illustration">
                    <div className="station-casing">
                      <div
                        className="station-water-level"
                        style={{
                          height: `${Math.min(92, Math.max(12, (selected.waterLevel / 20) * 100))}%`,
                          background: statusMeta[selected.status].color,
                        }}
                      />
                    </div>
                    <div className="station-solar-panel" />
                    <div className="station-antenna" />
                  </div>
                  <div className="station-meta-block">
                    <div className="station-id">{selected.id}</div>
                    <div className="station-location">
                      <MapPin size={12} /> {selected.district}, TN
                    </div>
                    <div className="station-coords">
                      {selected.lat.toFixed(2)}°N, {selected.lon.toFixed(2)}°E
                    </div>
                    <div className="station-updated">Updated: {selected.lastUpdated}</div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="metrics-column">
                  <div className="detail-metrics-grid">
                    <div className="detail-metric-card">
                      <span className="metric-label">CURRENT WATER LEVEL</span>
                      <strong
                        className="metric-val big"
                        style={{ color: statusMeta[selected.status].color }}
                      >
                        {selected.waterLevel.toFixed(1)} <small>m</small>
                      </strong>
                    </div>

                    <div className="detail-metric-card">
                      <span className="metric-label">7-DAY VARIATION</span>
                      <strong className={`metric-val ${selected.delta7d < 0 ? 'drop' : 'rise'}`}>
                        {selected.delta7d > 0 ? '+' : ''}
                        {selected.delta7d.toFixed(1)} m
                      </strong>
                    </div>

                    <div className="detail-metric-card">
                      <span className="metric-label">BOREWELL TOTAL DEPTH</span>
                      <strong className="metric-val">{selected.depth} m</strong>
                    </div>

                    <div className="detail-metric-card">
                      <span className="metric-label">DATA QUALITY SCORE</span>
                      <strong className="metric-val">{selected.sensorHealth}/100</strong>
                    </div>

                    <div className="detail-metric-card">
                      <span className="metric-label">MODEL CONFIDENCE</span>
                      <strong className="metric-val">{selected.confidence}%</strong>
                    </div>

                    <div className="detail-metric-card">
                      <span className="metric-label">NEIGHBOR AGREEMENT</span>
                      <strong className="metric-val">{selected.neighboringAgreement}%</strong>
                    </div>
                  </div>

                  {/* 7-day sparkline */}
                  <Mini7DayTrendChart trend7d={selected.trend7d} status={selected.status} />
                </div>

                {/* Key Insights List */}
                <div className="insights-column">
                  <div className="insights-header">
                    <Sparkles size={14} className="spark-icon" />
                    <strong>Key Intelligence Insights:</strong>
                  </div>
                  <ul className="insights-list">
                    {selected.keyInsights.map((insight, idx) => (
                      <li key={idx} className="insight-item">
                        <span
                          className="insight-bullet"
                          style={{ background: statusMeta[selected.status].color }}
                        />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="rainfall-context-pill">
                    <CloudRain size={14} />
                    <span>Rainfall Context:</span>
                    <strong className={selected.rainfallContext}>
                      {selected.rainfallContext.toUpperCase()}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline & Quick Actions Column */}
            <div className="right-bottom-stack">
              {/* Pipeline: Raw -> Trusted -> Intelligence */}
              <div className="panel pipeline-panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">
                      <Sparkles size={16} /> Raw → Trusted → Intelligence
                    </div>
                    <div className="panel-sub">
                      Automated pipeline turning noisy data into clear action
                    </div>
                  </div>
                </div>
                <Pipeline />
              </div>

              {/* Quick Actions */}
              <div className="panel action-panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">
                      <Search size={16} /> Quick Actions
                    </div>
                    <div className="panel-sub">Investigate selected borewell anomaly</div>
                  </div>
                </div>
                <div className="action-list">
                  <ActionRow
                    label="Open Anomaly Evidence (Explainability Modal)"
                    onClick={() => setIsExplainModalOpen(true)}
                  />
                  <ActionRow
                    label="Compare With Nearby Cluster (15 km)"
                    onClick={() => setIsExplainModalOpen(true)}
                  />
                  <ActionRow
                    label="Inspect Sensor Calibration & Data Quality"
                    onClick={() => setIsExplainModalOpen(true)}
                  />
                  <ActionRow
                    label="Export Evidence Brief (PDF / JSON)"
                    onClick={() => setIsExplainModalOpen(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Explainability Deep-Dive Modal */}
      <ExplainabilityModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        borewell={selected}
        researchInfo={activeResearchItem}
      />
    </main>
  );
}

function KpiCard({
  icon,
  label,
  value,
  meta,
  tone,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  meta: string;
  tone: string;
  sub: string;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} className={`kpi-card ${tone}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-copy">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-footer-row">
          <span className="kpi-meta">{meta}</span>
          <span className="kpi-sub">{sub}</span>
        </div>
      </div>
    </motion.div>
  );
}

function Pipeline() {
  const steps = [
    { n: '01', title: 'Raw Telemetry', desc: 'IoT depth sensors', color: 'blue' },
    { n: '02', title: 'Sensor QA', desc: 'Noise & health check', color: 'teal' },
    { n: '03', title: 'Season Baseline', desc: 'Climate-aware filter', color: 'green' },
    { n: '04', title: 'Attribution', desc: 'Sensor vs Groundwater', color: 'purple' },
  ];

  return (
    <div className="pipeline-container">
      {steps.map((s, idx) => (
        <React.Fragment key={s.n}>
          <div className={`pipeline-step-item ${s.color}`}>
            <div className="step-badge">{s.n}</div>
            <div className="step-info">
              <strong>{s.title}</strong>
              <small>{s.desc}</small>
            </div>
          </div>
          {idx < steps.length - 1 && <div className="pipeline-separator">→</div>}
        </React.Fragment>
      ))}
    </div>
  );
}

function ActionRow({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button className="action-item-btn" onClick={onClick}>
      <span>{label}</span>
      <ChevronRight size={15} />
    </button>
  );
}
