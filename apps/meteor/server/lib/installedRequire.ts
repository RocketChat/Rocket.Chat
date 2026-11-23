import { createRequire } from 'node:module';
import path from 'node:path';

declare const __meteor_bootstrap__: { serverDir: string };

/**
 * Node's `require` for the packages installed with the server. Meteor's own `require.resolve` answers with module ids
 * rather than paths, and a bundle is started from its root, with the packages under `programs/server`.
 */
export const installedRequire = createRequire(path.join(__meteor_bootstrap__.serverDir, 'npm', 'index.js'));
