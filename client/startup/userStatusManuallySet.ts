import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../app/callbacks/lib/callbacks';
import { UserStatus } from '../../definition/UserStatus';
import { fireGlobalEvent } from '../lib/utils/fireGlobalEvent';

/* fire user state change globally, to listen on desktop electron client */
Meteor.startup(() => {
	callbacks.add('userStatusManuallySet', (status: UserStatus) => {
		fireGlobalEvent('user-status-manually-set', status);
	});
});
