import { onLicense } from '../../app/license/server/license';

onLicense('livechat-enterprise', () => {
	import('./CannedResponse');
	import('./LivechatPriority');
	import('./LivechatTag');
	import('./LivechatUnit');
	import('./LivechatUnitMonitors');
	import('./LivechatRooms');
});
