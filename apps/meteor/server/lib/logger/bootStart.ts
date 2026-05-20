import { performance } from 'universal-perf-hooks';

import { SystemLogger } from './system';

export const BOOT_START = performance.now();

export const sinceBoot = (): number => Math.round(performance.now() - BOOT_START);

SystemLogger.startup({ msg: 'boot started', sinceBootMs: 0 });
