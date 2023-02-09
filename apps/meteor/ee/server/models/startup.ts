import { onLicense } from '../../app/license/server/license';

// To facilitate our lives with the stream
// Collection will be registered on CE too
// No functionality will be imported tho, just the service registration
import('./LivechatPriority');

onLicense('livechat-enterprise', () => {
	import('./CannedResponse');
	import('./LivechatTag');
	import('./LivechatUnit');
	import('./LivechatUnitMonitors');
	import('./LivechatRooms');
	import('./OmnichannelServiceLevelAgreements');
	import('./LivechatInquiry');
});
