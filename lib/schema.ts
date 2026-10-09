export type AnomalyClassification =
  | 'NORMAL'
  | 'SENSOR_ANOMALY'
  | 'GROUNDWATER_ANOMALY'
  | 'UNCERTAIN';

export type QualityFlag =
  | 'VALID'
  | 'MISSING'
  | 'DUPLICATE'
  | 'OUT_OF_BOUNDS'
  | 'FLATLINE'
  | 'SUDDEN_JUMP'
  | 'LONG_GAP'
  | 'LOW_VOLTAGE';

export type Season =
  | 'PRE_MONSOON_SUMMER'
  | 'SW_MONSOON'
  | 'NE_MONSOON'
  | 'POST_MONSOON_WINTER';

export interface GroundwaterReading {
  stationId: string;
  timestamp: string; // ISO-8601
  waterLevel: number; // meters below ground level (m bgl)
  lat: number;
  lon: number;
  source: string;
  temperatureC?: number;
  batteryVoltage?: number;
  qualityFlags: QualityFlag[];
  dataQualityScore: number; // 0 - 100
}

export interface RainfallReading {
  stationId: string;
  timestamp: string; // ISO-8601
  rainfallMm: number;
  cumulative14dMm: number;
  departureFromNormalPct: number;
  source: string;
}

export interface SeasonalBaseline {
  stationId: string;
  season: Season;
  medianLevel: number;
  madLevel: number; // Median Absolute Deviation
  expectedRangeMin: number;
  expectedRangeMax: number;
  historicalYearsCount: number;
}

export interface SensorHealth {
  stationId: string;
  healthScore: number; // 0 - 100
  batteryVolts: number;
  packetLossRate: number; // percentage
  driftRate: number; // mm/month
  lastServiceDate: string;
  hardwareStatus: 'OPTIMAL' | 'DEGRADED' | 'FAULTY';
}

export interface AnomalyEvidence {
  temporalRobustZScore: number; // Hampel filter z-score
  rateOfChangeMPerDay: number;
  persistenceDays: number;
  seasonalDeviationM: number;
  neighborAgreementPct: number;
  rainfallCorrelation: 'supporting' | 'neutral' | 'contradicting';
  dataQualityScore: number;
  supportedPoints: string[];
  missingPoints: string[];
}

export interface AnomalyAssessment {
  stationId: string;
  classification: AnomalyClassification;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  modelConfidence: number; // 0 - 100
  evidence: AnomalyEvidence;
  recommendedAction: string;
  whatChanged: string;
  whyUnusual: string;
  whatToCheckNext: string;
  assessedAt: string;
}

export interface DataQualityReport {
  stationId: string;
  totalReadings: number;
  dataQualityScore: number; // 0 - 100
  completenessRatio: number; // 0.0 - 1.0
  missingCount: number;
  duplicateCount: number;
  flatlineHours: number;
  suddenJumpCount: number;
  longGapCount: number;
  flags: QualityFlag[];
}

export interface ResearchBorewell {
  id: string;
  stationName: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
  x: number;
  z: number;
  aquiferType: string;
  wellDepthM: number;
  currentWaterLevelM: number;
  delta7dM: number;
  status: 'normal' | 'sensor' | 'groundwater' | 'uncertain';
  assessment: AnomalyAssessment;
  qualityReport: DataQualityReport;
  sensorHealth: SensorHealth;
  baseline: SeasonalBaseline;
  timeSeriesMonthly: { month: string; actualM: number; expectedM: number; expectedMin: number; expectedMax: number }[];
  timeSeries7d: { date: string; actualM: number }[];
  rainfallMonthly: { month: string; rainfallMm: number; waterLevelM: number }[];
  dataSource: string;
}
