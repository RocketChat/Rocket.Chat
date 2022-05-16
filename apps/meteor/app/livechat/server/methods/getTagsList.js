import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';

Meteor.methods({
	'livechat:getTagsList'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:getTagsList',
			});
		}

		return callbacks.run('livechat.beforeListTags');
	},
});
