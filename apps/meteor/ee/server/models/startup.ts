import { onLicense } from '../../app/license/server/license';

// To facilitate our lives with the stream
// Collection will be registered on CE too
// No functionality will be imported tho, just the service registration
import('./LivechatPriority');
import('./OmnichannelServiceLevelAgreements');

onLicense('livechat-enterprise', () => {
	import('./CannedResponse');
	import('./LivechatTag');
	import('./LivechatUnit');
	import('./LivechatUnitMonitors');
	import('./LivechatRooms');
	import('./LivechatInquiry');
	import('./ReadReceipts');
	import('./LivechatDepartment');
	import('./Users');
	import('./LivechatDepartmentAgents');
});
