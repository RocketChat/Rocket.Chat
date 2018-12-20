import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { RocketChat } from 'meteor/rocketchat:lib';
import { findGuest } from '../lib/livechat';

RocketChat.API.v1.addRoute('livechat/custom.field', {
	post() {
		try {
			check(this.bodyParams, {
				token: String,
				key: String,
				value: String,
				overwrite: Boolean,
			});

			const { token, key, value, overwrite } = this.bodyParams;

			const guest = findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			if (!RocketChat.Livechat.setCustomFields({ token, key, value, overwrite })) {
				return RocketChat.API.v1.failure();
			}

			return RocketChat.API.v1.success({ field: { key, value, overwrite } });
		} catch (e) {
			return RocketChat.API.v1.failure(e);
		}
	},
});

RocketChat.API.v1.addRoute('livechat/custom.fields', {
	post() {
		check(this.bodyParams, {
			token: String,
			customFields: [
				Match.ObjectIncluding({
					key: String,
					value: String,
					overwrite: Boolean,
				}),
			],
		});

		const { token } = this.bodyParams;
		const guest = findGuest(token);
		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		const fields = this.bodyParams.customFields.map((customField) => {
			const data = Object.assign({ token }, customField);
			if (!RocketChat.Livechat.setCustomFields(data)) {
				return RocketChat.API.v1.failure();
			}

			return { Key: customField.key, value: customField.value, overwrite: customField.overwrite };
		});

		return RocketChat.API.v1.success({ fields });
	},
});

