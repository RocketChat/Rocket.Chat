import { onLicense } from '../../app/license/server/license';

onLicense('livechat-enterprise', () => {
	require('./CannedResponse');
	require('./LivechatPriority');
	require('./LivechatTag');
	require('./LivechatUnit');
	require('./LivechatUnitMonitors');
	require('./LivechatRooms');
});
