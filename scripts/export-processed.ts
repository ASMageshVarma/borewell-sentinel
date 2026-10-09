import fs from 'fs';
import path from 'path';
import { getProcessedResearchBorewells } from '../lib/ingestion';

const processedDir = path.join(process.cwd(), 'data', 'processed');
if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}

const researchBorewells = getProcessedResearchBorewells();
const outputPath = path.join(processedDir, 'research-borewells.json');

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      stationCount: researchBorewells.length,
      stations: researchBorewells,
    },
    null,
    2
  ),
  'utf-8'
);

console.log(`✅ Processed research data successfully written to: ${outputPath}`);
