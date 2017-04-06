/* eslint-env mocha */
import assert from 'assert';

import MentionsServer from '../MentionsServer';


const mention = new MentionsServer({
	pattern: '[0-9a-zA-Z-_.]+',
	messageMaxAll: () => 2, //|| RocketChat.settings.get('Message_MaxAll')
	getUsers: (usernames) => {
		return Meteor.users.find({ username: {$in: _.unique(usernames)}}, { fields: {_id: true, username: true }}).fetch();
	},
	getChannel: (rid) => {
		return {
			usernames: [1]
		};
	}// RocketChat.models.Rooms.findOneById(message.rid);
});

describe('Mention Server', () => {
	describe('getUsersByMentions', () => {

		it('should return "all"', () => {
			const message = {
				msg: '@all'
			};
			const expected = [{
				_id: 'all',
				username: 'all'
			}];
			const result = mention.getUsersByMentions(message);
			assert.deepEqual(expected, result);
		});
		it('should return "here"', () => {
			const message = {
				msg: '@here'
			};
			const expected = [{
				_id: 'here',
				username: 'here'
			}];
			const result = mention.getUsersByMentions(message);
			assert.deepEqual(expected, result);
		});
	});
});
