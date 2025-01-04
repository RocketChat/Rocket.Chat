import '../models/startup';

import { performMigrationProcedure } from './migrations';

await performMigrationProcedure();
