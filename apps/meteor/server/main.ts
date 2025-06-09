import 'reflect-metadata';

import './models';
import './tracing';

/**
 * ./settings uses top level await, in theory the settings creation
 * and the startup should be done in parallel
 */
import './settings';

import { startRestAPI } from '../app/api/server/api';
import { settings } from '../app/settings/server';
import { startupApp } from '../ee/server';
import { startRocketChat } from '../startRocketChat';
import { configureServer } from './configuration';
import { registerServices } from './services/startup';
import { startup } from './startup';

import '../app/lib/server/startup';
import '../lib/oauthRedirectUriServer';
import './features/EmailInbox/index';
import './importPackages';
import './lib/pushConfig';
import './methods';
import './publications';
import './routes';

await Promise.all([configureServer(settings), registerServices(), startup()]);

await startRocketChat();
await startupApp();
await startRestAPI();
