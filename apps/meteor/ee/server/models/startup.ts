import { License } from '@rocket.chat/license';

// To facilitate our lives with the stream
// Collection will be registered on CE too
// No functionality will be imported tho, just the service registration
import('./OmnichannelServiceLevelAgreements');
import('./AuditLog');
import('./ReadReceipts');

void License.onLicense('livechat-enterprise', () => {
	import('./CannedResponse');
	import('./LivechatTag');
	import('./LivechatUnit');
	import('./LivechatUnitMonitors');
	import('./LivechatRooms');
	import('./LivechatInquiry');
	import('./LivechatDepartment');
	import('./Users');
	import('./LivechatDepartmentAgents');
});
