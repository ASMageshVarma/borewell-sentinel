'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  ShieldAlert,
  ShieldCheck,
  Waves,
  X,
  Zap,
} from 'lucide-react';
import type { AnomalyAssessment, DataQualityReport, ResearchBorewell } from '@/lib/schema';
import type { Borewell } from '@/lib/data';

interface ExplainabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  borewell: Borewell;
  researchInfo?: ResearchBorewell;
}

export function ExplainabilityModal({
  isOpen,
  onClose,
  borewell,
  researchInfo,
}: ExplainabilityModalProps) {
  if (!isOpen) return null;

  const assessment = researchInfo?.assessment;
  const qualityReport = researchInfo?.qualityReport;

  const statusTitle =
    borewell.status === 'groundwater'
      ? 'Likely Groundwater Anomaly'
      : borewell.status === 'sensor'
      ? 'Likely Sensor Hardware Fault'
      : borewell.status === 'uncertain'
      ? 'Uncertain Context (Awaiting Evidence)'
      : 'Normal Seasonal Equilibrium';

  const statusColor =
    borewell.status === 'groundwater'
      ? '#ff4c61'
      : borewell.status === 'sensor'
      ? '#ffbd3b'
      : borewell.status === 'uncertain'
      ? '#9a88ff'
      : '#35e9b8';

  // Fallbacks if in Demo Mode
  const whatChanged =
    assessment?.whatChanged ||
    (borewell.status === 'groundwater'
      ? `Persistent drop of ${Math.abs(borewell.delta7d)} m observed over the past 7 days.`
      : borewell.status === 'sensor'
      ? `Discontinuous spike reading departure to ${borewell.waterLevel} m recorded without regional agreement.`
      : borewell.status === 'uncertain'
      ? `Moderate decline under ambiguous local spatial consensus.`
      : `Water level at ${borewell.waterLevel} m adheres to expected seasonal bounds.`);

  const whyUnusual =
    assessment?.whyUnusual ||
    (borewell.status === 'groundwater'
      ? `Depletion breaches historical seasonal baseline by >2.5 MAD; corroborated by ${borewell.neighboringAgreement}% of cluster wells.`
      : borewell.status === 'sensor'
      ? `Neighbor agreement is only ${borewell.neighboringAgreement}%; departs sharply from unconfined aquifer permeability rates.`
      : borewell.status === 'uncertain'
      ? `Rainfall context contradicts drawdown; nearby sensor density is limited.`
      : `Adheres to expected regional baseline (±0.3 m). No anomaly threshold breached.`);

  const supportedPoints =
    assessment?.evidence.supportedPoints || borewell.keyInsights;

  const missingPoints =
    assessment?.evidence.missingPoints || [
      'Continuous 15-minute high-frequency logger data',
      'Satellite GRACE-FO regional mass anomaly assimilation',
    ];

  const whatToCheckNext =
    assessment?.whatToCheckNext ||
    (borewell.status === 'groundwater'
      ? 'Dispatch hydrogeological field team to inspect agricultural pumping cluster; cross-reference electricity grid loads.'
      : borewell.status === 'sensor'
      ? 'Recalibrate pressure transducer zero-point, test cable shield ground loop, and inspect solar battery voltage.'
      : borewell.status === 'uncertain'
      ? 'Continue 48-hour assimilation logging; await next satellite soil moisture pass.'
      : 'Maintain standard telemetry observation schedule.');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span
              className="modal-status-dot"
              style={{ background: statusColor, boxShadow: `0 0 10px ${statusColor}` }}
            />
            <div>
              <div className="modal-station-id">{borewell.id} — Explainability Analysis</div>
              <div className="modal-station-sub" style={{ color: statusColor }}>
                {statusTitle}
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Top Metric Cards */}
          <div className="modal-metrics-strip">
            <div className="modal-metric-card">
              <span className="modal-card-label">MODEL CONFIDENCE</span>
              <strong className="modal-card-val" style={{ color: statusColor }}>
                {borewell.confidence}%
              </strong>
              <small>Simulation assessment</small>
            </div>

            <div className="modal-metric-card">
              <span className="modal-card-label">DATA QUALITY SCORE</span>
              <strong className="modal-card-val">
                {qualityReport?.dataQualityScore ?? borewell.sensorHealth}/100
              </strong>
              <small>
                {qualityReport?.flags.join(', ') || 'Quality checks verified'}
              </small>
            </div>

            <div className="modal-metric-card">
              <span className="modal-card-label">NEIGHBOR AGREEMENT</span>
              <strong className="modal-card-val">
                {borewell.neighboringAgreement}%
              </strong>
              <small>Cluster consensus</small>
            </div>

            <div className="modal-metric-card">
              <span className="modal-card-label">RAINFALL CONTEXT</span>
              <strong className={`modal-card-val ${borewell.rainfallContext}`}>
                {borewell.rainfallContext.toUpperCase()}
              </strong>
              <small>14-day cumulative link</small>
            </div>
          </div>

          {/* Section 1: What Changed? */}
          <div className="explain-section">
            <div className="explain-section-title">
              <Info size={14} className="cyan-icon" />
              <span>WHAT CHANGED?</span>
            </div>
            <p className="explain-section-text">{whatChanged}</p>
          </div>

          {/* Section 2: Why Is It Unusual? */}
          <div className="explain-section">
            <div className="explain-section-title">
              <Zap size={14} className="yellow-icon" />
              <span>WHY IS IT UNUSUAL?</span>
            </div>
            <p className="explain-section-text">{whyUnusual}</p>
          </div>

          {/* Section 3: Supporting Evidence */}
          <div className="explain-section">
            <div className="explain-section-title">
              <CheckCircle2 size={14} className="green-icon" />
              <span>WHAT EVIDENCE SUPPORTS THIS CLASSIFICATION?</span>
            </div>
            <ul className="evidence-checklist">
              {supportedPoints.map((item, idx) => (
                <li key={idx} className="evidence-check-item">
                  <span className="check-bullet green">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 4: Missing Evidence */}
          <div className="explain-section">
            <div className="explain-section-title">
              <HelpCircle size={14} className="purple-icon" />
              <span>WHAT EVIDENCE IS MISSING OR UNCONFIRMED?</span>
            </div>
            <ul className="evidence-checklist">
              {missingPoints.map((item, idx) => (
                <li key={idx} className="evidence-check-item">
                  <span className="check-bullet purple">?</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 5: Recommended Next Action */}
          <div className="explain-action-box">
            <div className="explain-action-label">RECOMMENDED NEXT INVESTIGATION STEP</div>
            <div className="explain-action-body">{whatToCheckNext}</div>
          </div>

          {/* Provenance footer */}
          <div className="modal-provenance-footer">
            <span>
              <strong>Data Provenance:</strong>{' '}
              {researchInfo?.dataSource ||
                'Central Ground Water Board (CGWB) & WRIS Tamil Nadu DWLR Network • IMD Precipitation'}
            </span>
            <span className="scientific-disclaimer">
              Prototype model assessment. Simulation evidence only; not established as statutory proof.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
