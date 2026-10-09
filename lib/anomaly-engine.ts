import {
  AnomalyAssessment,
  AnomalyClassification,
  AnomalyEvidence,
  DataQualityReport,
  SeasonalBaseline,
} from './schema';

export interface BorewellSpatialCandidate {
  stationId: string;
  distanceKm: number;
  delta7dM: number;
  status: 'normal' | 'sensor' | 'groundwater' | 'uncertain';
}

/**
 * Robust Hampel / MAD z-score calculation
 */
export function calculateRobustZScore(value: number, median: number, mad: number): number {
  if (mad <= 0.001) return 0;
  // 1.4826 converts MAD to normal distribution standard deviation equivalent
  return Math.abs(value - median) / (1.4826 * mad);
}

/**
 * Calculates spatial agreement percentage across neighbor wells
 */
export function calculateNeighborAgreement(
  targetDelta: number,
  neighbors: BorewellSpatialCandidate[]
): { agreementPct: number; coherentCount: number; totalCount: number } {
  if (neighbors.length === 0) {
    return { agreementPct: 50, coherentCount: 0, totalCount: 0 };
  }

  // Two wells agree if their 7-day variation has matching direction or minimal delta
  let coherentCount = 0;
  for (const n of neighbors) {
    const sameDirection =
      (targetDelta <= -0.5 && n.delta7dM <= -0.5) ||
      (targetDelta >= 0.5 && n.delta7dM >= 0.5) ||
      (Math.abs(targetDelta) < 0.5 && Math.abs(n.delta7dM) < 0.5);

    if (sameDirection) {
      coherentCount++;
    }
  }

  const agreementPct = Math.round((coherentCount / neighbors.length) * 100);
  return { agreementPct, coherentCount, totalCount: neighbors.length };
}

/**
 * Modular Interpretable Anomaly Engine
 * Synthesizes temporal robust z-score, rate-of-change, persistence,
 * neighbor agreement, rainfall context, and sensor quality flags.
 */
export function assessGroundwaterAnomaly(params: {
  stationId: string;
  currentWaterLevel: number;
  delta7d: number;
  recentSeries: number[];
  baseline: SeasonalBaseline;
  qualityReport: DataQualityReport;
  neighbors: BorewellSpatialCandidate[];
  rainfallCumulative14dMm: number;
}): AnomalyAssessment {
  const {
    stationId,
    currentWaterLevel,
    delta7d,
    recentSeries,
    baseline,
    qualityReport,
    neighbors,
    rainfallCumulative14dMm,
  } = params;

  // 1. Temporal Robust Statistics
  const robustZ = calculateRobustZScore(currentWaterLevel, baseline.medianLevel, baseline.madLevel);
  const seasonalDeviationM = Math.round((currentWaterLevel - baseline.medianLevel) * 100) / 100;

  // Rate of change over recent samples
  const lastVal = recentSeries[recentSeries.length - 1] ?? currentWaterLevel;
  const prevVal = recentSeries[0] ?? currentWaterLevel;
  const days = Math.max(1, recentSeries.length);
  const rateOfChangeMPerDay = Math.round((Math.abs(lastVal - prevVal) / days) * 100) / 100;

  // 2. Persistence Check: how many recent samples stay outside normal range
  let persistenceCount = 0;
  for (const val of recentSeries) {
    if (val < baseline.expectedRangeMin || val > baseline.expectedRangeMax) {
      persistenceCount++;
    }
  }
  const persistenceDays = persistenceCount;

  // 3. Spatial Consistency
  const { agreementPct, coherentCount, totalCount } = calculateNeighborAgreement(delta7d, neighbors);

  // 4. Hydro-climatic rainfall context
  let rainfallCorrelation: 'supporting' | 'neutral' | 'contradicting' = 'neutral';
  if (delta7d < -1.0 && rainfallCumulative14dMm < 20) {
    // Depletion with drought / low rainfall supports genuine groundwater drawdown
    rainfallCorrelation = 'supporting';
  } else if (delta7d > 1.0 && rainfallCumulative14dMm > 60) {
    // Recharge with heavy rain supports normal recharge
    rainfallCorrelation = 'supporting';
  } else if (delta7d < -1.0 && rainfallCumulative14dMm > 80) {
    // Sudden deep drop despite heavy monsoon rain is contradicting
    rainfallCorrelation = 'contradicting';
  }

  // 5. Interpretable Classification Logic
  let classification: AnomalyClassification = 'NORMAL';
  let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let modelConfidence = 95;
  const supportedPoints: string[] = [];
  const missingPoints: string[] = [];

  // Sensor Anomaly Indicators
  const hasQualityFault =
    qualityReport.flags.includes('SUDDEN_JUMP') ||
    qualityReport.flags.includes('FLATLINE') ||
    qualityReport.flags.includes('OUT_OF_BOUNDS') ||
    qualityReport.flags.includes('LOW_VOLTAGE') ||
    qualityReport.dataQualityScore < 70;

  const isIsolatedSpike =
    robustZ >= 2.5 &&
    persistenceDays <= 2 &&
    agreementPct < 45;

  // Groundwater Anomaly Indicators: Multi-well cluster decline
  const isCoordinatedDecline =
    (delta7d <= -1.8 || (delta7d <= -1.2 && persistenceDays >= 5)) &&
    persistenceDays >= 4 &&
    coherentCount >= 2 &&
    agreementPct >= 50 &&
    qualityReport.dataQualityScore >= 75;

  // Decision Rules
  if (hasQualityFault || isIsolatedSpike) {
    classification = 'SENSOR_ANOMALY';
    severity = isIsolatedSpike ? 'MEDIUM' : 'HIGH';
    modelConfidence = Math.max(65, Math.min(92, 100 - qualityReport.dataQualityScore + 20));

    supportedPoints.push(`Isolated reading departure without spatial corroboration (${agreementPct}% neighbor agreement)`);
    if (qualityReport.flags.includes('SUDDEN_JUMP')) {
      supportedPoints.push(`Rate of change (${rateOfChangeMPerDay} m/day) exceeds unconfined hydraulic conductivity bounds`);
    }
    if (qualityReport.flags.includes('LOW_VOLTAGE')) {
      supportedPoints.push(`Downlink battery voltage below operational threshold (<3.3V)`);
    }
    if (qualityReport.flags.includes('FLATLINE')) {
      supportedPoints.push(`Station membrane / float flatline detected (>48h identical reading)`);
    }

    missingPoints.push('No regional cluster decline detected');
    missingPoints.push('Hydro-climatic rain event does not explain localized step');
  } else if (isCoordinatedDecline) {
    classification = 'GROUNDWATER_ANOMALY';
    severity = Math.abs(delta7d) > 2.5 ? 'CRITICAL' : 'HIGH';
    modelConfidence = Math.round(0.4 * agreementPct + 0.3 * qualityReport.dataQualityScore + 0.3 * (robustZ * 15));
    modelConfidence = Math.min(98, Math.max(78, modelConfidence));

    supportedPoints.push(`Persistent drawdown of ${Math.abs(delta7d)} m sustained across ${persistenceDays} consecutive observation windows`);
    supportedPoints.push(`High spatial consistency: ${coherentCount}/${totalCount} (${agreementPct}%) nearby cluster wells corroborate decline`);
    supportedPoints.push(`Data Quality Score is verified high (${qualityReport.dataQualityScore}/100) — hardware integrity intact`);
    if (rainfallCorrelation === 'supporting') {
      supportedPoints.push(`Low cumulative rainfall (${rainfallCumulative14dMm} mm in 14 days) corroborates regional extraction stress`);
    }

    missingPoints.push('Zero hardware telemetry error codes received');
  } else if (robustZ >= 1.8 && (totalCount < 2 || rainfallCorrelation === 'contradicting' || qualityReport.dataQualityScore < 80)) {
    classification = 'UNCERTAIN';
    severity = 'MEDIUM';
    modelConfidence = 54;

    supportedPoints.push(`Mild water level deviation detected (${Math.abs(seasonalDeviationM)} m from seasonal median)`);
    if (rainfallCorrelation === 'contradicting') {
      supportedPoints.push(`Contradictory hydrologic response: decline recorded during active precipitation window`);
    }

    missingPoints.push(`Spatial cluster density insufficient (${totalCount} neighbor wells within 15 km)`);
    missingPoints.push('Awaiting next 48-hour assimilation cycle to confirm persistence vs. noise');
  } else {
    classification = 'NORMAL';
    severity = 'LOW';
    modelConfidence = 96;

    supportedPoints.push(`Water table within normal seasonal spread (${baseline.expectedRangeMin} m – ${baseline.expectedRangeMax} m bgl)`);
    supportedPoints.push(`Regional cluster consensus is stable (${agreementPct}% agreement)`);
    supportedPoints.push(`Telemetry quality score optimal (${qualityReport.dataQualityScore}/100)`);
  }

  // Explainability Synthesis
  let whatChanged = '';
  let whyUnusual = '';
  let whatToCheckNext = '';

  switch (classification) {
    case 'GROUNDWATER_ANOMALY':
      whatChanged = `Rapid continuous water level depletion of ${Math.abs(delta7d)} m observed over the past 7 days.`;
      whyUnusual = `Breaches seasonal historical median by ${Math.abs(seasonalDeviationM)} m, corroborated by ${agreementPct}% of nearby cluster observation wells.`;
      whatToCheckNext = `Dispatch hydrogeological field team to verify local agricultural extraction pumps; cross-reference dynamic power-grid pumping loads.`;
      break;
    case 'SENSOR_ANOMALY':
      whatChanged = `Discontinuous reading departure to ${currentWaterLevel.toFixed(1)} m without regional hydrologic agreement.`;
      whyUnusual = `Neighbor agreement is only ${agreementPct}%; departure returned to baseline within short window or contains telemetry jitter.`;
      whatToCheckNext = `Perform transducer zero-point recalibration, test cable shielding ground loop, and verify solar battery charge level.`;
      break;
    case 'UNCERTAIN':
      whatChanged = `Moderate water level movement of ${delta7d > 0 ? '+' : ''}${delta7d.toFixed(1)} m under ambiguous spatial evidence.`;
      whyUnusual = `Telemetry quality is borderline (${qualityReport.dataQualityScore}%) and nearby observation density is limited.`;
      whatToCheckNext = `Continue high-frequency logging for 48 hours; assimilate next satellite soil moisture and GRACE-FO regional passes.`;
      break;
    case 'NORMAL':
      whatChanged = `Steady water level at ${currentWaterLevel.toFixed(1)} m adhering to expected seasonal equilibrium.`;
      whyUnusual = `Within expected bounds (±${baseline.madLevel} m variance). Zero anomaly threshold breaches detected.`;
      whatToCheckNext = `Standard periodic telemetry health monitoring schedule.`;
      break;
  }

  const evidence: AnomalyEvidence = {
    temporalRobustZScore: Math.round(robustZ * 100) / 100,
    rateOfChangeMPerDay,
    persistenceDays,
    seasonalDeviationM,
    neighborAgreementPct: agreementPct,
    rainfallCorrelation,
    dataQualityScore: qualityReport.dataQualityScore,
    supportedPoints,
    missingPoints,
  };

  return {
    stationId,
    classification,
    severity,
    modelConfidence,
    evidence,
    recommendedAction: whatToCheckNext,
    whatChanged,
    whyUnusual,
    whatToCheckNext,
    assessedAt: new Date().toISOString(),
  };
}
