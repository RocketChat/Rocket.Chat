import { createAccountSettings } from './accounts';
import { createAnalyticsSettings } from './analytics';
import { createAssetsSettings } from './assets';
import { createBotsSettings } from './bots';
import { createCasSettings } from './cas';
import { createCrowdSettings } from './crowd';
import { createEmojiSettings } from './custom-emoji';
import { createSoundsSettings } from './custom-sounds';
import { createDiscussionsSettings } from './discussions';
import { createE2ESettings } from './e2e';
import { createEmailSettings } from './email';
import { createFederationSettings } from './federation';
import { createFederationServiceSettings } from './federation-service';
import { createFileUploadSettings } from './file-upload';
import { createGeneralSettings } from './general';
import { createIRCSettings } from './irc';
import { createLayoutSettings } from './layout';
import { createLdapSettings } from './ldap';
import { createLogSettings } from './logs';
import { createMessageSettings } from './message';
import { createMetaSettings } from './meta';
import { createMiscSettings } from './misc';
import { createMobileSettings } from './mobile';
import { createOauthSettings } from './oauth';
import { createOmniSettings } from './omnichannel';
import { createPushSettings } from './push';
import { createRateLimitSettings } from './rate';
import { createRetentionSettings } from './retention-policy';
import { createSetupWSettings } from './setup-wizard';
import { createSlackBridgeSettings } from './slackbridge';
import { createSmarshSettings } from './smarsh';
import { createThreadSettings } from './threads';
import { createTroubleshootSettings } from './troubleshoot';
import { createUserDataSettings } from './userDataDownload';
import { createVConfSettings } from './video-conference';
import { createWebDavSettings } from './webdav';
import { addMatrixBridgeFederationSettings } from '../services/federation/Settings';

await Promise.all([
	createFederationServiceSettings(),
	createAccountSettings(),
	createAnalyticsSettings(),
	createAssetsSettings(),
	createBotsSettings(),
	createCasSettings(),
	createCrowdSettings(),
	createEmojiSettings(),
	createSoundsSettings(),
	createDiscussionsSettings(),
	createEmailSettings(),
	createE2ESettings(),
	createFileUploadSettings(),
	createGeneralSettings(),
	createIRCSettings(),
	createLdapSettings(),
	createLogSettings(),
	createLayoutSettings(),
	createMessageSettings(),
	createMetaSettings(),
	createMiscSettings(),
	createMobileSettings(),
	createOauthSettings(),
	createOmniSettings(),
	createPushSettings(),
	createRateLimitSettings(),
	createRetentionSettings(),
	createSetupWSettings(),
	createSlackBridgeSettings(),
	createSmarshSettings(),
	createThreadSettings(),
	createTroubleshootSettings(),
	createVConfSettings(),
	createUserDataSettings(),
	createWebDavSettings(),
]);

// Run after all the other settings are created since it depends on some of them
await Promise.all([
	createFederationSettings(), // Deprecated and not used anymore. Kept for admin UI information purposes. Remove on 8.0
	addMatrixBridgeFederationSettings(), // Deprecated and not used anymore. Kept for admin UI information purposes. Remove on 8.0
]);
