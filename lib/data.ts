export type BorewellStatus = 'normal' | 'sensor' | 'groundwater' | 'uncertain';

export type Borewell = {
  id: string;
  district: string;
  lat: number;
  lon: number;
  x: number;
  z: number;
  waterLevel: number;
  depth: number;
  delta7d: number;
  status: BorewellStatus;
  confidence: number;
  sensorHealth: number;
  trend7d: number[];
  monthlyTrend: number[];
  expectedBaseline: number[];
  anomalyMonthIndex?: number;
  anomalyCallout?: string;
  neighboringAgreement: number;
  rainfallContext: 'supporting' | 'neutral' | 'contradicting';
  keyInsights: string[];
  stationType: string;
  lastUpdated: string;
  battery: number;
};

export const borewells: Borewell[] = [
  {
    id: 'BW-01',
    district: 'Coimbatore',
    lat: 11.02,
    lon: 76.96,
    x: -5.6,
    z: -1.5,
    waterLevel: 13.6,
    depth: 118,
    delta7d: -0.2,
    status: 'normal',
    confidence: 97,
    sensorHealth: 98,
    trend7d: [13.8, 13.7, 13.7, 13.6, 13.6, 13.6, 13.6],
    monthlyTrend: [13.2, 13.4, 13.7, 14.1, 14.0, 13.8, 13.6],
    expectedBaseline: [13.0, 13.3, 13.6, 14.0, 13.9, 13.7, 13.5],
    neighboringAgreement: 92,
    rainfallContext: 'neutral',
    keyInsights: [
      'Water levels within normal seasonal variance (±0.2 m)',
      '9/9 neighboring wells confirm regional baseline stability',
      'Normal recharge response after moderate September showers',
      'Telemetry diagnostics: Sensor health 98%, no drift'
    ],
    stationType: 'Piezometric Pressure Transducer',
    lastUpdated: 'Yesterday, 18:45',
    battery: 98
  },
  {
    id: 'BW-02',
    district: 'Erode',
    lat: 11.34,
    lon: 77.72,
    x: -1.7,
    z: 0.5,
    waterLevel: 15.1,
    depth: 104,
    delta7d: -0.4,
    status: 'normal',
    confidence: 95,
    sensorHealth: 95,
    trend7d: [15.5, 15.4, 15.3, 15.2, 15.2, 15.1, 15.1],
    monthlyTrend: [14.0, 14.5, 15.2, 15.8, 15.6, 15.3, 15.1],
    expectedBaseline: [14.2, 14.6, 15.0, 15.6, 15.4, 15.2, 15.0],
    neighboringAgreement: 88,
    rainfallContext: 'supporting',
    keyInsights: [
      'Gradual agricultural drawdown aligned with cropping cycle',
      'Local aquifer layer shows steady recharge equilibrium',
      'Supported by adjacent sensor cross-correlations',
      'Sensor health: 95% with optimal signal strength'
    ],
    stationType: 'Ultrasonic Subsurface Level Sensor',
    lastUpdated: 'Today, 12:10',
    battery: 94
  },
  {
    id: 'BW-03',
    district: 'Tiruppur',
    lat: 11.10,
    lon: 77.34,
    x: -7.5,
    z: -4.1,
    waterLevel: 12.4,
    depth: 132,
    delta7d: 0.2,
    status: 'normal',
    confidence: 96,
    sensorHealth: 99,
    trend7d: [12.2, 12.2, 12.3, 12.3, 12.4, 12.4, 12.4],
    monthlyTrend: [11.8, 12.0, 12.2, 12.7, 12.6, 12.5, 12.4],
    expectedBaseline: [11.9, 12.1, 12.3, 12.6, 12.5, 12.4, 12.3],
    neighboringAgreement: 94,
    rainfallContext: 'supporting',
    keyInsights: [
      'Stable water table level in hard-rock weathered aquifer',
      'High coherence with seasonal monsoon precipitation data',
      'Consistent readings with 0% dropped telemetry frames',
      'Zero anomaly threshold breaches across past 90 days'
    ],
    stationType: 'Submersible Hydrostatic Probe',
    lastUpdated: 'Today, 13:50',
    battery: 99
  },
  {
    id: 'BW-04',
    district: 'Salem',
    lat: 11.66,
    lon: 78.15,
    x: 2.1,
    z: -2.8,
    waterLevel: 15.2,
    depth: 88,
    delta7d: 1.4,
    status: 'sensor',
    confidence: 68,
    sensorHealth: 61,
    trend7d: [15.0, 15.1, 15.0, 15.2, 18.4, 15.3, 15.2],
    monthlyTrend: [14.6, 14.8, 15.0, 15.2, 18.4, 15.3, 15.2],
    expectedBaseline: [14.5, 14.7, 14.9, 15.1, 15.2, 15.2, 15.1],
    anomalyMonthIndex: 4,
    anomalyCallout: 'Sudden Spike (18.4 m)',
    neighboringAgreement: 34,
    rainfallContext: 'neutral',
    keyInsights: [
      'Isolated high-amplitude spike to 18.4 m without rainfall event',
      'Neighbouring borewells (Salem cluster) show no corresponding shift (34% agreement)',
      'Signal returned to previous plateau within 2 sampling windows',
      'Recommendation: Recalibrate transducer and verify cable ground loop before field dispatch'
    ],
    stationType: 'Pressure Transducer with Solar IoT Gateway',
    lastUpdated: 'Today, 11:17',
    battery: 76
  },
  {
    id: 'BW-05',
    district: 'Namakkal',
    lat: 11.22,
    lon: 78.17,
    x: 5.1,
    z: 1.0,
    waterLevel: 9.6,
    depth: 146,
    delta7d: -2.8,
    status: 'groundwater',
    confidence: 88,
    sensorHealth: 96,
    trend7d: [12.4, 11.8, 11.2, 10.6, 10.1, 9.8, 9.6],
    monthlyTrend: [13.8, 13.2, 12.5, 11.8, 10.5, 9.8, 9.6],
    expectedBaseline: [14.0, 14.2, 14.5, 14.8, 14.5, 14.2, 13.9],
    anomalyMonthIndex: 5,
    anomalyCallout: 'Anomaly Detected (9.6 m)',
    neighboringAgreement: 86,
    rainfallContext: 'supporting',
    keyInsights: [
      'Rapid persistent drop of 2.8 m over 7 days in deep fractured aquifer',
      '86% neighbor agreement — nearby wells in Namakkal confirm coordinated depletion',
      'Cumulative rainfall 42% below 10-year seasonal median for this zone',
      'Sensor health verified at 96% — genuine hydrogeological depletion event flagged'
    ],
    stationType: 'Optical Submersible Transducer + LoRaWAN',
    lastUpdated: 'Today, 14:32',
    battery: 92
  },
  {
    id: 'BW-07',
    district: 'Karur',
    lat: 10.96,
    lon: 78.08,
    x: 7.3,
    z: -3.3,
    waterLevel: 8.4,
    depth: 152,
    delta7d: -0.9,
    status: 'sensor',
    confidence: 61,
    sensorHealth: 58,
    trend7d: [8.5, 8.4, 8.5, 8.1, 8.6, 8.2, 8.4],
    monthlyTrend: [9.1, 9.0, 8.9, 8.7, 7.8, 8.2, 8.4],
    expectedBaseline: [9.2, 9.3, 9.4, 9.5, 9.3, 9.1, 8.9],
    anomalyMonthIndex: 4,
    anomalyCallout: 'Noisy Reading (7.8 m)',
    neighboringAgreement: 40,
    rainfallContext: 'neutral',
    keyInsights: [
      'High-frequency telemetry jitter inconsistent with aquifer time constants',
      'Low neighbor coherence (40%) confirms localized hardware aberration',
      'Battery voltage degradation flagged on telemetry downlink (3.2V nominal)',
      'Classified as Sensor Anomaly to prevent unwarranted water rationing alerts'
    ],
    stationType: 'Capacitive Water Probe',
    lastUpdated: 'Today, 09:03',
    battery: 62
  },
  {
    id: 'BW-12',
    district: 'Madurai',
    lat: 9.92,
    lon: 78.12,
    x: -0.3,
    z: 5.7,
    waterLevel: 10.7,
    depth: 121,
    delta7d: -1.1,
    status: 'uncertain',
    confidence: 54,
    sensorHealth: 75,
    trend7d: [11.8, 11.5, 11.2, 11.0, 10.9, 10.8, 10.7],
    monthlyTrend: [12.4, 12.2, 11.9, 11.6, 11.2, 10.9, 10.7],
    expectedBaseline: [12.6, 12.8, 13.0, 13.2, 13.1, 12.9, 12.7],
    anomalyMonthIndex: 6,
    anomalyCallout: 'Ambiguous Drift',
    neighboringAgreement: 48,
    rainfallContext: 'contradicting',
    keyInsights: [
      'Water table decline observed despite recent localized cloudbursts',
      'Intermediate spatial density prevents definitive neighbor voting (48%)',
      'Sensor health is borderline at 75% with mild calibration drift',
      'Borewell Sentinel flags as UNCERTAIN until next 48-hour assimilation cycle'
    ],
    stationType: 'Vibrating Wire Piezometer',
    lastUpdated: 'Today, 07:45',
    battery: 81
  },
  {
    id: 'BW-15',
    district: 'Thoothukudi',
    lat: 8.80,
    lon: 78.10,
    x: 4.0,
    z: 5.0,
    waterLevel: 13.8,
    depth: 98,
    delta7d: 0.1,
    status: 'normal',
    confidence: 98,
    sensorHealth: 98,
    trend7d: [13.6, 13.7, 13.7, 13.8, 13.8, 13.8, 13.8],
    monthlyTrend: [13.0, 13.3, 13.6, 14.0, 13.9, 13.8, 13.8],
    expectedBaseline: [13.1, 13.4, 13.7, 14.1, 14.0, 13.8, 13.7],
    neighboringAgreement: 94,
    rainfallContext: 'neutral',
    keyInsights: [
      'Coastal sedimentary aquifer maintains stable hydraulic gradient',
      'No saltwater intrusion anomalies or uncharacteristic conductivity spikes',
      'High agreement with state groundwater department observation wells',
      'Sensor operating normally with 98% telemetry link reliability'
    ],
    stationType: 'Conductivity & Pressure Integrated Sonde',
    lastUpdated: 'Today, 14:15',
    battery: 97
  },
];

export const rainfallMonthly = [38, 61, 83, 134, 152, 107, 67];
export const groundwaterMonthly = [9.0, 9.8, 10.7, 12.8, 14.6, 13.4, 11.2];
export const monthsList = ["Apr '26", "May '26", "Jun '26", "Jul '26", "Aug '26", "Sep '26", "Oct '26"];

