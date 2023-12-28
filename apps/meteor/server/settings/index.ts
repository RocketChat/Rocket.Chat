import { createAccountSettings } from './accounts';
import { createAnalyticsSettings } from './analytics';
import { createAssetsSettings } from './assets';
import { createBotsSettings } from './bots';
import { createCallCenterSettings } from './call-center';
import { createCasSettings } from './cas';
import { createCrowdSettings } from './crowd';
import { createEmojiSettings } from './custom-emoji';
import { createSoundsSettings } from './custom-sounds';
import { createDiscussionsSettings } from './discussions';
import { createE2ESettings } from './e2e';
import { createEmailSettings } from './email';
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
import { createOTRSettings } from './otr';
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
import { createWebRTCSettings } from './webrtc';

async function createSettings() {
	await Promise.all([
		createAccountSettings(),
		createAnalyticsSettings(),
		createAssetsSettings(),
		createBotsSettings(),
		createCallCenterSettings(),
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
		createOTRSettings(),
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
		createWebRTCSettings(),
	]);
}

await createSettings();
