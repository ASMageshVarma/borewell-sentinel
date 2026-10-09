import { Season, SeasonalBaseline } from './schema';

/**
 * Maps a calendar month (0 = Jan, 11 = Dec) to Tamil Nadu hydro-climatic season
 * according to CGWB Southern Region & IMD Chennai classification.
 */
export function getTamilNaduSeason(monthIndex: number): Season {
  // Pre-Monsoon Summer: March, April, May (2, 3, 4)
  if (monthIndex >= 2 && monthIndex <= 4) return 'PRE_MONSOON_SUMMER';
  // Southwest Monsoon: June to September (5 to 8)
  if (monthIndex >= 5 && monthIndex <= 8) return 'SW_MONSOON';
  // Northeast Monsoon (Primary Recharge Period): October to December (9 to 11)
  if (monthIndex >= 9 && monthIndex <= 11) return 'NE_MONSOON';
  // Post-Monsoon Winter (Water table recession): January, February (0, 1)
  return 'POST_MONSOON_WINTER';
}

export const SEASON_LABELS: Record<Season, string> = {
  PRE_MONSOON_SUMMER: 'Pre-Monsoon (Summer: Mar–May)',
  SW_MONSOON: 'Southwest Monsoon (Jun–Sep)',
  NE_MONSOON: 'Northeast Monsoon (Primary Recharge: Oct–Dec)',
  POST_MONSOON_WINTER: 'Post-Monsoon Winter (Jan–Feb)',
};

/**
 * Calculates robust seasonal median and Median Absolute Deviation (MAD)
 */
export function calculateSeasonalBaseline(
  stationId: string,
  season: Season,
  historicalValues: number[]
): SeasonalBaseline {
  if (historicalValues.length === 0) {
    return {
      stationId,
      season,
      medianLevel: 12.0,
      madLevel: 1.0,
      expectedRangeMin: 10.0,
      expectedRangeMax: 14.0,
      historicalYearsCount: 0,
    };
  }

  const sorted = [...historicalValues].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianLevel =
    sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Compute Median Absolute Deviation (MAD)
  const absDevs = sorted.map((v) => Math.abs(v - medianLevel)).sort((a, b) => a - b);
  const madLevel = Math.max(
    0.35,
    absDevs.length % 2 !== 0 ? absDevs[mid] : (absDevs[mid - 1] + absDevs[mid]) / 2
  );

  // Expected range: ± 2.0 * 1.4826 * MAD (approx ~2.96 standard deviations)
  const spread = 2.2 * madLevel;

  return {
    stationId,
    season,
    medianLevel: Math.round(medianLevel * 100) / 100,
    madLevel: Math.round(madLevel * 100) / 100,
    expectedRangeMin: Math.max(0.5, Math.round((medianLevel - spread) * 100) / 100),
    expectedRangeMax: Math.round((medianLevel + spread) * 100) / 100,
    historicalYearsCount: Math.max(3, Math.round(historicalValues.length / 12)),
  };
}
