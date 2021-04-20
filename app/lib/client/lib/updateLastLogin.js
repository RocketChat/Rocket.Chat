import { Meteor } from 'meteor/meteor';

import { handleError } from '../../../utils';

Meteor.startup(function() {
	if (Meteor.userId) {
        Meteor.call('updateLastLogin', (error) => {
            if (error) {
                return handleError(error);
            }
        });
    }
});
