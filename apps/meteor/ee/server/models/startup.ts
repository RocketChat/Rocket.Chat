import { onLicense } from '../../app/license/server/license';

// Note: we're intentionally putting it out of onLicense since this model will also be used for CE
import('./GrandfatherLicense');

onLicense('livechat-enterprise', () => {
	import('./CannedResponse');
	import('./LivechatPriority');
	import('./LivechatTag');
	import('./LivechatUnit');
	import('./LivechatUnitMonitors');
	import('./LivechatRooms');
});
