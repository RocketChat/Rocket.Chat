import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	'livechat:getTagsList'() {
		methodDeprecationLogger.warn('livechat:getTagsList will be deprecated in future versions of Rocket.Chat');
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:getTagsList',
			});
		}

		return callbacks.run('livechat.beforeListTags');
	},
});
