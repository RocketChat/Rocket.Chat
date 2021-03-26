import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../app/callbacks/client';
import { fireGlobalEvent } from '../../app/ui-utils/client';
import { USER_STATUS } from '../../definition/UserStatus';

/* fire user state change globally, to listen on desktop electron client */
Meteor.startup(() => {
	callbacks.add('userStatusManuallySet', (status: USER_STATUS) => {
		fireGlobalEvent('user-status-manually-set', status);
	});
});
