import { DataQualityReport, GroundwaterReading, QualityFlag } from './schema';

export interface QualityCheckOptions {
  maxPhysicalDepthM?: number;
  maxValidStepMPerDay?: number;
  flatlineWindowHours?: number;
  maxAllowableGapHours?: number;
}

/**
 * Data Quality Engine
 * Executes systematic validation checks before anomaly attribution
 * Outputs a DATA QUALITY SCORE (0 - 100) and specific diagnostic flags.
 */
export function runDataQualityPipeline(
  readings: { timestamp: string; waterLevel: number | null; batteryVoltage?: number }[],
  options: QualityCheckOptions = {}
): DataQualityReport {
  const maxDepth = options.maxPhysicalDepthM ?? 250;
  const maxStep = options.maxValidStepMPerDay ?? 3.5;
  const flatlineHoursLimit = options.flatlineWindowHours ?? 48;
  const maxGapHours = options.maxAllowableGapHours ?? 72;

  let missingCount = 0;
  let duplicateCount = 0;
  let suddenJumpCount = 0;
  let flatlineHours = 0;
  let longGapCount = 0;
  let outOfBoundsCount = 0;
  let lowVoltageCount = 0;

  const seenTimestamps = new Set<string>();
  const flags = new Set<QualityFlag>();

  let consecutiveIdentical = 0;
  let prevVal: number | null = null;
  let prevTime: number | null = null;

  for (let i = 0; i < readings.length; i++) {
    const r = readings[i];
    const currentTime = new Date(r.timestamp).getTime();

    // 1. Missing value check
    if (r.waterLevel === null || r.waterLevel === undefined || Number.isNaN(r.waterLevel)) {
      missingCount++;
      flags.add('MISSING');
      continue;
    }

    // 2. Duplicate check
    if (seenTimestamps.has(r.timestamp)) {
      duplicateCount++;
      flags.add('DUPLICATE');
    }
    seenTimestamps.add(r.timestamp);

    // 3. Impossible value check
    if (r.waterLevel < 0 || r.waterLevel > maxDepth) {
      outOfBoundsCount++;
      flags.add('OUT_OF_BOUNDS');
    }

    // 4. Low battery voltage check
    if (r.batteryVoltage !== undefined && r.batteryVoltage < 3.3) {
      lowVoltageCount++;
      flags.add('LOW_VOLTAGE');
    }

    // 5. Timestamp interval / Long gap check
    if (prevTime !== null) {
      const hoursDiff = (currentTime - prevTime) / (1000 * 60 * 60);
      if (hoursDiff > maxGapHours) {
        longGapCount++;
        flags.add('LONG_GAP');
      }
    }

    // 6. Sudden jump check
    if (prevVal !== null && prevTime !== null) {
      const daysDiff = Math.max(0.04, (currentTime - prevTime) / (1000 * 60 * 60 * 24));
      const rate = Math.abs(r.waterLevel - prevVal) / daysDiff;
      if (rate > maxStep) {
        suddenJumpCount++;
        flags.add('SUDDEN_JUMP');
      }
    }

    // 7. Flatline detection
    if (prevVal !== null && Math.abs(r.waterLevel - prevVal) < 0.001) {
      consecutiveIdentical++;
      if (consecutiveIdentical >= 6) {
        flatlineHours += 12;
        flags.add('FLATLINE');
      }
    } else {
      consecutiveIdentical = 0;
    }

    prevVal = r.waterLevel;
    prevTime = currentTime;
  }

  const validCount = readings.length - missingCount;
  const completenessRatio = readings.length > 0 ? validCount / readings.length : 0;

  // Deduct penalties from base score 100
  let score = 100;
  score -= missingCount * 4;
  score -= duplicateCount * 3;
  score -= outOfBoundsCount * 12;
  score -= suddenJumpCount * 8;
  score -= Math.min(25, (flatlineHours / 24) * 5);
  score -= longGapCount * 6;
  score -= lowVoltageCount * 5;

  const dataQualityScore = Math.max(10, Math.min(100, Math.round(score)));

  if (flags.size === 0) {
    flags.add('VALID');
  }

  return {
    stationId: 'GENERIC',
    totalReadings: readings.length,
    dataQualityScore,
    completenessRatio: Math.round(completenessRatio * 100) / 100,
    missingCount,
    duplicateCount,
    flatlineHours,
    suddenJumpCount,
    longGapCount,
    flags: Array.from(flags),
  };
}
