// eslint-disable-next-line import/order -- must load first so BOOT_START captures the earliest possible reference
import { sinceBoot } from './lib/logger/bootStart';
import './tracing';
import './models';

/**
 * ./settings uses top level await, in theory the settings creation
 * and the startup should be done in parallel
 */
import './settings';

import { performance } from 'universal-perf-hooks';

import { configureServer } from './configuration';
import { SystemLogger } from './lib/logger/system';
import { registerServices } from './services/startup';
import { startup } from './startup';
import { startRestAPI } from '../app/api/server/api';
import { settings } from '../app/settings/server';
import { startupApp } from '../ee/server';
import { startRocketChat } from '../startRocketChat';

import './routes';
import '../app/lib/server/startup';
import './importPackages';
import './methods';
import './publications';
import '../lib/oauthRedirectUriServer';
import './lib/pushConfig';
import './features/EmailInbox/index';

SystemLogger.startup({ msg: 'Phase 1 started', sinceBootMs: sinceBoot() });
const phase1Start = performance.now();
await Promise.all([configureServer(settings), registerServices(), startup()]);
SystemLogger.startup({ msg: 'Phase 1 complete', elapsedMs: Math.round(performance.now() - phase1Start), sinceBootMs: sinceBoot() });

await startRocketChat();
await startupApp();
await startRestAPI();

SystemLogger.startup({ msg: 'boot complete', sinceBootMs: sinceBoot() });
