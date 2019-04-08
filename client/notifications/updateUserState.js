import { Meteor } from 'meteor/meteor';
import { fireGlobalEvent } from '../../app/ui-utils';
import { callbacks } from '../../app/callbacks';

/* fire user state change globally, to listen on desktop electron client */
Meteor.startup(function() {
	callbacks.add('userStatusManuallySet', (status) => {
		fireGlobalEvent('user-status-manually-set', status);
	});
});
