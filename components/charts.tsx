'use client';

import React from 'react';
import type { Borewell } from '@/lib/data';
import { monthsList, rainfallMonthly, groundwaterMonthly } from '@/lib/data';

const STATUS_COLOR = {
  normal: '#35e9b8',
  sensor: '#ffbd3b',
  groundwater: '#ff4c61',
  uncertain: '#9a88ff',
};

export function WaterTrendChart({ selected }: { selected: Borewell }) {
  const width = 580;
  const height = 210;
  const padLeft = 45;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 35;

  const maxRecorded = Math.max(...selected.monthlyTrend, ...selected.expectedBaseline, 20);
  const yMin = 0;
  const yMax = Math.max(25, Math.ceil(maxRecorded / 5) * 5);

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getX = (i: number) => padLeft + (i / (selected.monthlyTrend.length - 1)) * chartW;
  const getY = (val: number) => padTop + ((yMax - val) / (yMax - yMin)) * chartH;

  // Actual curve path
  const actualPath = selected.monthlyTrend
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`)
    .join(' ');

  // Baseline dashed line path
  const baselinePath = selected.expectedBaseline
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`)
    .join(' ');

  const strokeColor = STATUS_COLOR[selected.status];
  const hasAnomaly = selected.anomalyMonthIndex !== undefined;
  const anomalyIdx = selected.anomalyMonthIndex ?? 4;
  const anomalyX = getX(anomalyIdx);
  const anomalyY = getY(selected.monthlyTrend[anomalyIdx] ?? 10);

  // Shaded area under actual line
  const areaPath = `${actualPath} L ${getX(selected.monthlyTrend.length - 1).toFixed(1)} ${padTop + chartH} L ${padLeft} ${padTop + chartH} Z`;

  // Grid steps (e.g. 0, 5, 10, 15, 20, 25)
  const gridSteps = Array.from({ length: Math.floor(yMax / 5) + 1 }, (_, i) => i * 5);

  return (
    <div className="chart-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label={`Water level trend for ${selected.id}`}>
        <defs>
          <linearGradient id={`trendGrad-${selected.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="anomalyBandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff4c61" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ff4c61" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Y-axis Title */}
        <text x={padLeft} y={padTop - 12} className="chart-axis-title">
          DEPTH (M BGL)
        </text>

        {/* Horizontal grid lines & Y labels */}
        {gridSteps.map((val) => {
          const y = getY(val);
          return (
            <g key={val}>
              <line x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke="rgba(145,170,190,0.12)" strokeDasharray="3 3" />
              <text x={padLeft - 10} y={y + 3.5} textAnchor="end" className="chart-axis-label">{val}</text>
            </g>
          );
        })}

        {/* Anomaly highlight column if applicable */}
        {hasAnomaly && (
          <g>
            <rect
              x={anomalyX - 22}
              y={padTop}
              width={44}
              height={chartH}
              fill="url(#anomalyBandGrad)"
              rx={6}
            />
            <line
              x1={anomalyX}
              x2={anomalyX}
              y1={padTop}
              y2={padTop + chartH}
              stroke={strokeColor}
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
          </g>
        )}

        {/* Gradient fill below curve */}
        <path d={areaPath} fill={`url(#trendGrad-${selected.id})`} />

        {/* Normal Expected Baseline (dashed) */}
        <path
          d={baselinePath}
          fill="none"
          stroke="#36d4ff"
          strokeWidth="2"
          strokeDasharray="5 5"
          opacity="0.75"
        />

        {/* Actual water level curve */}
        <path
          d={actualPath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {selected.monthlyTrend.map((v, i) => {
          const cx = getX(i);
          const cy = getY(v);
          const isAnomaly = hasAnomaly && i === anomalyIdx;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={isAnomaly ? 6 : 3.5}
              fill={isAnomaly ? '#ffffff' : strokeColor}
              stroke={strokeColor}
              strokeWidth={isAnomaly ? 3 : 1.5}
            />
          );
        })}

        {/* X axis month labels */}
        {monthsList.map((m, i) => (
          <text key={m} x={getX(i)} y={padTop + chartH + 20} textAnchor="middle" className="chart-axis-label">
            {m}
          </text>
        ))}

        {/* Y axis title */}
        <text
          x={14}
          y={padTop + chartH / 2}
          transform={`rotate(-90 14 ${padTop + chartH / 2})`}
          textAnchor="middle"
          className="chart-axis-title"
        >
          Water Level (m)
        </text>

        {/* Anomaly Callout Box */}
        {hasAnomaly && selected.anomalyCallout && (
          <g transform={`translate(${Math.max(padLeft + 10, Math.min(width - padRight - 140, anomalyX - 65))}, ${Math.max(6, anomalyY - 34)})`}>
            <rect
              width="130"
              height="24"
              rx="6"
              fill="rgba(20, 6, 12, 0.94)"
              stroke={strokeColor}
              strokeWidth="1.2"
              filter="drop-shadow(0 2px 8px rgba(0,0,0,0.5))"
            />
            <text x="65" y="16" textAnchor="middle" fill={strokeColor} className="chart-callout-text">
              {selected.anomalyCallout}
            </text>
          </g>
        )}
      </svg>

      {/* Chart Footer Legend */}
      <div className="chart-footer-legend">
        <span className="legend-item">
          <span className="legend-line" style={{ background: strokeColor }} />
          <strong>{selected.id}</strong> (Actual)
        </span>
        <span className="legend-item">
          <span className="legend-line dashed" style={{ borderColor: '#36d4ff' }} />
          Normal Range
        </span>
      </div>
    </div>
  );
}

export function RainfallChart() {
  const width = 580;
  const height = 210;
  const padLeft = 45;
  const padRight = 45;
  const padTop = 26;
  const padBottom = 35;

  const rainMax = 200;
  const levelMax = 20;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const n = months.length;

  const getX = (i: number) => padLeft + (i + 0.5) * (chartW / n);
  const getRainY = (val: number) => padTop + ((rainMax - val) / rainMax) * chartH;
  const getLevelY = (val: number) => padTop + ((levelMax - val) / levelMax) * chartH;

  const linePoints = groundwaterMonthly.map((v, i) => `${getX(i).toFixed(1)},${getLevelY(v).toFixed(1)}`).join(' ');

  return (
    <div className="chart-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label="Rainfall compared with groundwater level">
        <defs>
          <linearGradient id="rainBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4da7ff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 50, 100, 150, 200].map((val) => {
          const y = getRainY(val);
          return (
            <g key={val}>
              <line x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke="rgba(145,170,190,0.12)" strokeDasharray="3 3" />
              <text x={padLeft - 8} y={y + 3.5} textAnchor="end" className="chart-axis-label">{val}</text>
              <text x={width - padRight + 8} y={y + 3.5} textAnchor="start" className="chart-axis-label">{(val / 10).toFixed(0)}</text>
            </g>
          );
        })}

        {/* Rainfall Bars */}
        {rainfallMonthly.map((r, i) => {
          const barW = Math.min(38, (chartW / n) * 0.58);
          const x = getX(i) - barW / 2;
          const y = getRainY(r);
          const h = padTop + chartH - y;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={5}
              fill="url(#rainBarGrad)"
            />
          );
        })}

        {/* Groundwater Level Line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="#b7ff6a"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Groundwater Level Dots */}
        {groundwaterMonthly.map((v, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getLevelY(v)}
            r={4}
            fill="#091b24"
            stroke="#b7ff6a"
            strokeWidth="2.2"
          />
        ))}

        {/* Month labels */}
        {months.map((m, i) => (
          <text key={m} x={getX(i)} y={padTop + chartH + 20} textAnchor="middle" className="chart-axis-label">
            {m}
          </text>
        ))}

        {/* Axis titles */}
        <text
          x={13}
          y={padTop + chartH / 2}
          transform={`rotate(-90 13 ${padTop + chartH / 2})`}
          textAnchor="middle"
          className="chart-axis-title"
        >
          Rainfall (mm)
        </text>
        <text
          x={width - 12}
          y={padTop + chartH / 2}
          transform={`rotate(90 ${width - 12} ${padTop + chartH / 2})`}
          textAnchor="middle"
          className="chart-axis-title"
        >
          Water Level (m)
        </text>
      </svg>

      {/* Chart Footer Legend */}
      <div className="chart-footer-legend">
        <span className="legend-item">
          <span className="legend-box" style={{ background: '#4da7ff' }} />
          Rainfall (mm)
        </span>
        <span className="legend-item">
          <span className="legend-dot green" />
          Groundwater Level (m)
        </span>
      </div>
    </div>
  );
}

export function AnomalyClassificationDonut({
  normal,
  sensor,
  groundwater,
  uncertain,
}: {
  normal: number;
  sensor: number;
  groundwater: number;
  uncertain: number;
}) {
  const anomaliesTotal = sensor + groundwater + uncertain;
  const total = normal + anomaliesTotal;

  // Slices: Groundwater, Sensor, Uncertain
  const gwPct = total > 0 ? (groundwater / total) * 100 : 0;
  const snPct = total > 0 ? (sensor / total) * 100 : 0;
  const unPct = total > 0 ? (uncertain / total) * 100 : 0;

  const gwShareOfAnomalies = anomaliesTotal > 0 ? Math.round((groundwater / anomaliesTotal) * 100) : 0;
  const snShareOfAnomalies = anomaliesTotal > 0 ? Math.round((sensor / anomaliesTotal) * 100) : 0;
  const unShareOfAnomalies = anomaliesTotal > 0 ? Math.round((uncertain / anomaliesTotal) * 100) : 0;

  // SVG Donut calculations (circumference = 2 * PI * r)
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.29

  const gwLen = (gwPct / 100) * circumference;
  const snLen = (snPct / 100) * circumference;
  const unLen = (unPct / 100) * circumference;
  const normLen = circumference - gwLen - snLen - unLen;

  let offset = 0;
  const gwDash = `${gwLen} ${circumference}`;
  const gwOffset = -offset;
  offset += gwLen;

  const snDash = `${snLen} ${circumference}`;
  const snOffset = -offset;
  offset += snLen;

  const unDash = `${unLen} ${circumference}`;
  const unOffset = -offset;
  offset += unLen;

  const normDash = `${normLen} ${circumference}`;
  const normOffset = -offset;

  return (
    <div className="donut-panel-body">
      <div className="donut-chart-container">
        <svg viewBox="0 0 160 160" className="donut-svg">
          {/* Base track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="15"
          />

          {/* Normal track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#1b5247"
            strokeWidth="15"
            strokeDasharray={normDash}
            strokeDashoffset={normOffset}
            transform="rotate(-90 80 80)"
          />

          {/* Uncertain track */}
          {unLen > 0 && (
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#9a88ff"
              strokeWidth="15"
              strokeDasharray={unDash}
              strokeDashoffset={unOffset}
              transform="rotate(-90 80 80)"
            />
          )}

          {/* Sensor anomaly track */}
          {snLen > 0 && (
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#ffbd3b"
              strokeWidth="15"
              strokeDasharray={snDash}
              strokeDashoffset={snOffset}
              transform="rotate(-90 80 80)"
            />
          )}

          {/* Groundwater anomaly track */}
          {gwLen > 0 && (
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#ff4c61"
              strokeWidth="15"
              strokeDasharray={gwDash}
              strokeDashoffset={gwOffset}
              transform="rotate(-90 80 80)"
            />
          )}

          {/* Center text */}
          <text x="80" y="74" textAnchor="middle" className="donut-center-num">
            {anomaliesTotal}
          </text>
          <text x="80" y="93" textAnchor="middle" className="donut-center-label">
            Total Anomalies
          </text>
        </svg>
      </div>

      <div className="donut-legend">
        <div className="donut-legend-row">
          <span className="donut-dot red" />
          <div className="donut-legend-text">
            <span>Groundwater Anomaly</span>
            <strong>{groundwater} ({gwShareOfAnomalies}%)</strong>
          </div>
        </div>

        <div className="donut-legend-row">
          <span className="donut-dot yellow" />
          <div className="donut-legend-text">
            <span>Sensor Anomaly</span>
            <strong>{sensor} ({snShareOfAnomalies}%)</strong>
          </div>
        </div>

        <div className="donut-legend-row">
          <span className="donut-dot purple" />
          <div className="donut-legend-text">
            <span>Uncertain</span>
            <strong>{uncertain} ({unShareOfAnomalies}%)</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Mini7DayTrendChart({ trend7d, status }: { trend7d: number[]; status: Borewell['status'] }) {
  const width = 260;
  const height = 90;
  const padLeft = 24;
  const padRight = 12;
  const padTop = 14;
  const padBottom = 22;

  const min = Math.min(...trend7d) - 0.5;
  const max = Math.max(...trend7d) + 0.5;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getX = (i: number) => padLeft + (i / (trend7d.length - 1)) * chartW;
  const getY = (val: number) => padTop + ((max - val) / (max - min || 1)) * chartH;

  const path = trend7d.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`).join(' ');
  const color = STATUS_COLOR[status];

  return (
    <div className="mini-chart-box">
      <div className="mini-chart-title">Water Level Trend (Last 7 Days)</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mini-chart-svg">
        {[min, (min + max) / 2, max].map((v, idx) => {
          const y = getY(v);
          return (
            <line key={idx} x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
          );
        })}
        <path d={path} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {trend7d.map((v, i) => (
          <circle key={i} cx={getX(i)} cy={getY(v)} r={3} fill={color} />
        ))}
        {['Oct 1', 'Oct 2', 'Oct 3', 'Oct 4', 'Oct 5', 'Oct 6', 'Oct 7'].map((d, i) => (
          <text key={d} x={getX(i)} y={height - 5} textAnchor="middle" className="mini-chart-label">
            {d}
          </text>
        ))}
      </svg>
    </div>
  );
}
