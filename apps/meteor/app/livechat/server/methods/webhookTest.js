import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { settings } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

const postCatchError = function (url, options) {
	try {
		return HTTP.post(url, options);
	} catch (e) {
		return e;
	}
};

Meteor.methods({
	'livechat:webhookTest'() {
		methodDeprecationLogger.info(`Method 'livechat:webhookTest' is deprecated and will be removed in future versions of Rocket.Chat`);
		this.unblock();

		const sampleData = {
			type: 'LivechatSession',
			_id: 'fasd6f5a4sd6f8a4sdf',
			label: 'title',
			topic: 'asiodojf',
			createdAt: new Date(),
			lastMessageAt: new Date(),
			tags: ['tag1', 'tag2', 'tag3'],
			customFields: {
				productId: '123456',
			},
			visitor: {
				_id: '',
				name: 'visitor name',
				username: 'visitor-username',
				department: 'department',
				email: 'email@address.com',
				phone: '192873192873',
				ip: '123.456.7.89',
				browser: 'Chrome',
				os: 'Linux',
				customFields: {
					customerId: '123456',
				},
			},
			agent: {
				_id: 'asdf89as6df8',
				username: 'agent.username',
				name: 'Agent Name',
				email: 'agent@email.com',
			},
			messages: [
				{
					username: 'visitor-username',
					msg: 'message content',
					ts: new Date(),
				},
				{
					username: 'agent.username',
					agentId: 'asdf89as6df8',
					msg: 'message content from agent',
					ts: new Date(),
				},
			],
		};

		const options = {
			headers: {
				'X-RocketChat-Livechat-Token': settings.get('Livechat_secret_token'),
			},
			data: sampleData,
		};

		const response = postCatchError(settings.get('Livechat_webhookUrl'), options);

		SystemLogger.debug({ response });

		if (response && response.statusCode && response.statusCode === 200) {
			return true;
		}
		throw new Meteor.Error('error-invalid-webhook-response');
	},
});
