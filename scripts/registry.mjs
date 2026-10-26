import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { root, registry } from './package.mjs';
writeFileSync(join(root, 'registry.json'), JSON.stringify(registry(), null, 2) + '\n');
