import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Node.js candidate resolution to locate root monorepo .env whether executed
// from repository root or apps/server workspace directory.
const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(process.cwd(), '../.env'),
  typeof __dirname !== 'undefined' ? path.resolve(__dirname, '../../.env') : '',
  typeof __dirname !== 'undefined' ? path.resolve(__dirname, '../../../.env') : ''
].filter(Boolean);

let activeEnvPath: string | null = null;
for (const candidate of candidatePaths) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    activeEnvPath = candidate;
    break;
  }
}

if (!activeEnvPath) {
  dotenv.config();
}

export const RESOLVED_ENV_PATH = activeEnvPath;
