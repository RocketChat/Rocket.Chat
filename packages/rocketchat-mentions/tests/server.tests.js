/* eslint-env mocha */
import 'babel-polyfill';
import assert from 'assert';

import MentionsServer from '../server/Mentions';


let mention;

beforeEach(function() {
	mention = new MentionsServer({
		pattern: '[0-9a-zA-Z-_.]+',
		messageMaxAll: () => 4, //|| RocketChat.settings.get('Message_MaxAll')
		getUsers: (usernames) => {
			return [{
				_id: 1,
				username: 'rocket.cat'
			}, {
				_id: 2,
				username: 'jon'
			}].filter(user => usernames.includes(user.username));//Meteor.users.find({ username: {$in: _.unique(usernames)}}, { fields: {_id: true, username: true }}).fetch();
		},
		getChannel: () => {
			return {
				usernames: [{
					_id: 1,
					username: 'rocket.cat'
				}, {
					_id: 2,
					username: 'jon'
				}]
			};
			// RocketChat.models.Rooms.findOneById(message.rid);,
		},
		getChannels(channels) {
			return [{
				_id: 1,
				name: 'general'
			}].filter(channel => channels.includes(channel.name));
			// return RocketChat.models.Rooms.find({ name: {$in: _.unique(channels)}, t: 'c'	}, { fields: {_id: 1, name: 1 }}).fetch();
		}
	});
});

describe('Mention Server', () => {
	describe('getUsersByMentions', () => {
		describe('for @all but the number of users is greater than messageMaxAll', () => {
			beforeEach(() => {
				mention.getChannel = () => {
					return {
						usernames:[{
							_id: 1,
							username: 'rocket.cat'
						}, {
							_id: 2,
							username: 'jon'
						}, {
							_id: 3,
							username: 'jon1'
						}, {
							_id: 4,
							username: 'jon2'
						}, {
							_id: 5,
							username: 'jon3'
						}]
					};
					//Meteor.users.find({ username: {$in: _.unique(usernames)}}, { fields: {_id: true, username: true }}).fetch();
				};
			});
			it('should return nothing', () => {
				const message = {
					msg: '@all'
				};
				const expected = [];
				const result = mention.getUsersByMentions(message);
				assert.deepEqual(expected, result);
			});
		});
		describe('for one user', () => {
			beforeEach(() => {
				mention.getChannel = () => {
					return {
						usernames:[{
							_id: 1,
							username: 'rocket.cat'
						}, {
							_id: 2,
							username: 'jon'
						}]
					};
					//Meteor.users.find({ username: {$in: _.unique(usernames)}}, { fields: {_id: true, username: true }}).fetch();
				};
			});
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
			it('should return "rocket.cat"', () => {
				const message = {
					msg: '@rocket.cat'
				};
				const expected = [{
					_id: 1,
					username: 'rocket.cat'
				}];
				const result = mention.getUsersByMentions(message);
				assert.deepEqual(expected, result);
			});
		});
		describe('for two user', () => {
			it('should return "all and here"', () => {
				const message = {
					msg: '@all @here'
				};
				const expected = [{
					_id: 'all',
					username: 'all'
				}, {
					_id: 'here',
					username: 'here'
				}];
				const result = mention.getUsersByMentions(message);
				assert.deepEqual(expected, result);
			});
			it('should return "here and rocket.cat"', () => {
				const message = {
					msg: '@here @rocket.cat'
				};
				const expected = [{
					_id: 'here',
					username: 'here'
				}, {
					_id: 1,
					username: 'rocket.cat'
				}];
				const result = mention.getUsersByMentions(message);
				assert.deepEqual(expected, result);
			});

			it('should return "here, rocket.cat, jon"', () => {
				const message = {
					msg: '@here @rocket.cat @jon'
				};
				const expected = [{
					_id: 'here',
					username: 'here'
				}, {
					_id: 1,
					username: 'rocket.cat'
				}, {
					_id: 2,
					username: 'jon'
				}];
				const result = mention.getUsersByMentions(message);
				assert.deepEqual(expected, result);
			});
		});

		describe('for an unknow user', () => {
			it('should return "nothing"', () => {
				const message = {
					msg: '@unknow'
				};
				const expected = [];
				const result = mention.getUsersByMentions(message);
				assert.deepEqual(expected, result);
			});
		});

	});
	describe('getChannelbyMentions', () => {
		it('should return the channel "general"', () => {
			const message = {
				msg: '#general'
			};
			const expected = [{
				_id: 1,
				name: 'general'
			}];
			const result = mention.getChannelbyMentions(message);
			assert.deepEqual(result, expected);
		});
		it('should return nothing"', () => {
			const message = {
				msg: '#unknow'
			};
			const expected = [];
			const result = mention.getChannelbyMentions(message);
			assert.deepEqual(result, expected);
		});
	});
	describe('execute', () => {
		it('should return the channel "general"', () => {
			const message = {
				msg: '#general'
			};
			const expected = [{
				_id: 1,
				name: 'general'
			}];
			const result = mention.getChannelbyMentions(message);
			assert.deepEqual(result, expected);
		});
		it('should return nothing"', () => {
			const message = {
				msg: '#unknow'
			};
			const expected = {
				msg: '#unknow',
				mentions: [],
				channels: []
			};
			const result = mention.execute(message);
			assert.deepEqual(result, expected);
		});
	});

	describe('getters and setters', ()=> {
		describe('messageMaxAll', ()=> {
			const mention = new MentionsServer({});
			describe('constant', ()=> {
				it('should return the informed value', () => {
					mention.messageMaxAll = 4;
					assert.deepEqual(mention.messageMaxAll, 4);
				});
			});
			describe('function', ()=> {
				it('should return the informed value', () => {
					mention.messageMaxAll = () => 4;
					assert.deepEqual(mention.messageMaxAll, 4);
				});
			});
		});
		describe('getUsers', ()=> {
			const mention = new MentionsServer({});
			describe('constant', ()=> {
				it('should return the informed value', () => {
					mention.getUsers = 4;
					assert.deepEqual(mention.getUsers(), 4);
				});
			});
			describe('function', ()=> {
				it('should return the informed value', () => {
					mention.getUsers = () => 4;
					assert.deepEqual(mention.getUsers(), 4);
				});
			});
		});
		describe('getChannels', ()=> {
			const mention = new MentionsServer({});
			describe('constant', ()=> {
				it('should return the informed value', () => {
					mention.getChannels = 4;
					assert.deepEqual(mention.getChannels(), 4);
				});
			});
			describe('function', ()=> {
				it('should return the informed value', () => {
					mention.getChannels = () => 4;
					assert.deepEqual(mention.getChannels(), 4);
				});
			});
		});
		describe('getChannel', ()=> {
			const mention = new MentionsServer({});
			describe('constant', ()=> {
				it('should return the informed value', () => {
					mention.getChannel = true;
					assert.deepEqual(mention.getChannel(), true);
				});
			});
			describe('function', ()=> {
				it('should return the informed value', () => {
					mention.getChannel = () => true;
					assert.deepEqual(mention.getChannel(), true);
				});
			});
		});
	});
});
