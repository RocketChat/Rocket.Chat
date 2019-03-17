import { Meteor } from 'meteor/meteor';
import { handleError, slashCommands } from '../../utils';
import { hasPermission } from '../../authorization';
/*
 * Join is a named function that will replace /status commands
 * @param {Object} message - The message object
 */

function Status(command, params) {
	if (command === 'status') {
		if ((Meteor.isClient && hasPermission('edit-other-user-info')) || (Meteor.isServer && hasPermission(Meteor.userId(), 'edit-other-user-info'))) {
			Meteor.call('setStatusMessage', params, (err) => {
				if (err) {
					if (Meteor.isClient) {
						return handleError(err);
					} else {
						throw err;
					}
				}
			});
		}
	}
}

slashCommands.add('status', Status, {
	description: 'Slash_Status_Description',
	params: 'Slash_Status_Params',
});
