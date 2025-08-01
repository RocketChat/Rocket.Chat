import './models/startup';
import '../app/license/server';
import '../app/api-enterprise/server/index';
import '../app/authorization/server/index';
import '../app/canned-responses/server/index';
import '../app/livechat-enterprise/server/index';
import '../app/message-read-receipt/server/index';
import '../app/voip-enterprise/server/index';
import './api';
import '../app/settings/server/index';
import './requestSeatsRoute';
import './configuration/index';
import './local-services/ldap/service';
import './methods/getReadReceipts';
import './patches';
import { License } from '@rocket.chat/license';

export * from './apps/startup';
export { registerEEBroker } from './startup';

await License.onLicense('federation', async () => {
	await import('./hooks/federation');
});
