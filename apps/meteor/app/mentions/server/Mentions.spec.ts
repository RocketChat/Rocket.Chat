import { MentionsServer } from './Mentions';

let mention: MentionsServer;

beforeEach(() => {
	mention = new MentionsServer({
		pattern: () => '[0-9a-zA-Z-_.]+',
		messageMaxAll: () => 4, // || RocketChat.settings.get('Message_MaxAll')
		getUsers: async (usernames) =>
			[
				{
					type: 'user' as const,
					_id: '1',
					username: 'rocket.cat',
				},
				{
					type: 'user' as const,
					_id: '2',
					username: 'jon',
				},
			].filter((user) => usernames.includes(user.username)), // Meteor.users.find({ username: {$in: _.unique(usernames)}}, { fields: {_id: true, username: true }}).fetch();
		getChannels: async (channels) =>
			[
				{
					_id: '1',
					name: 'general',
				},
			].filter((channel) => channels.includes(channel.name)) as any,
		// return RocketChat.models.Rooms.find({ name: {$in: _.unique(channels)}, t: 'c'	}, { fields: {_id: 1, name: 1 }}).fetch();
		getUser: async (userId) => ({ _id: userId, language: 'en' }) as any,
		getTotalChannelMembers: async (/* rid*/) => 2,
		onMaxRoomMembersExceeded: async () => {
			/* do nothing */
		},
	});
});

describe('Mention Server', () => {
	describe('getUsersByMentions', () => {
		describe('for @all but the number of users is greater than messageMaxAll', () => {
			beforeEach(() => {
				mention.getTotalChannelMembers = async () => 5;
			});
			it('should return nothing', async () => {
				const message = {
					msg: '@all',
				} as any;
				const expected: any[] = [];
				const result = await mention.getUsersByMentions(message);
				expect(result).toEqual(expected);
			});
		});
		describe('for one user', () => {
			beforeEach(() => {
				(mention as any).getChannel = () => ({
					usernames: [
						{
							_id: '1',
							username: 'rocket.cat',
						},
						{
							_id: '2',
							username: 'jon',
						},
					],
				});
				// Meteor.users.find({ username: {$in: _.unique(usernames)}}, { fields: {_id: true, username: true }}).fetch();
			});
			it('should return "all"', async () => {
				const message = {
					msg: '@all',
				} as any;
				const expected = [
					{
						_id: 'all',
						username: 'all',
					},
				];
				const result = await mention.getUsersByMentions(message);
				expect(result).toEqual(expected);
			});
			it('should return "here"', async () => {
				const message = {
					msg: '@here',
				} as any;
				const expected = [
					{
						_id: 'here',
						username: 'here',
					},
				];
				const result = await mention.getUsersByMentions(message);
				expect(result).toEqual(expected);
			});
			it('should return "rocket.cat"', async () => {
				const message = {
					msg: '@rocket.cat',
				} as any;
				const expected = [
					{
						type: 'user',
						_id: '1',
						username: 'rocket.cat',
					},
				];
				const result = await mention.getUsersByMentions(message);
				expect(result).toEqual(expected);
			});
		});
		describe('for two user', () => {
			it('should return "all and here"', async () => {
				const message = {
					msg: '@all @here',
				} as any;
				const expected = [
					{
						_id: 'all',
						username: 'all',
					},
					{
						_id: 'here',
						username: 'here',
					},
				];
				const result = await mention.getUsersByMentions(message);
				expect(result).toEqual(expected);
			});
			it('should return "here and rocket.cat"', async () => {
				const message = {
					msg: '@here @rocket.cat',
				} as any;
				const expected = [
					{
						_id: 'here',
						username: 'here',
					},
					{
						type: 'user',
						_id: '1',
						username: 'rocket.cat',
					},
				];
				const result = await mention.getUsersByMentions(message);
				expect(result).toEqual(expected);
			});

			it('should return "here, rocket.cat, jon"', async () => {
				const message = {
					msg: '@here @rocket.cat @jon',
				} as any;
				const expected = [
					{
						_id: 'here',
						username: 'here',
					},
					{
						type: 'user',
						_id: '1',
						username: 'rocket.cat',
					},
					{
						type: 'user',
						_id: '2',
						username: 'jon',
					},
				];
				const result = await mention.getUsersByMentions(message);
				expect(result).toEqual(expected);
			});
		});

		describe('for an unknow user', () => {
			it('should return "nothing"', async () => {
				const message = {
					msg: '@unknow',
				} as any;
				const expected: any[] = [];
				const result = await mention.getUsersByMentions(message);
				expect(result).toEqual(expected);
			});
		});
	});
	describe('getChannelbyMentions', () => {
		it('should return the channel "general"', async () => {
			const message = {
				msg: '#general',
			} as any;
			const expected = [
				{
					_id: '1',
					name: 'general',
				},
			];
			const result = await mention.getChannelbyMentions(message);
			expect(result).toEqual(expected);
		});
		it('should return nothing"', async () => {
			const message = {
				msg: '#unknow',
			} as any;
			const expected: any[] = [];
			const result = await mention.getChannelbyMentions(message);
			expect(result).toEqual(expected);
		});
	});
	describe('execute', () => {
		it('should return the channel "general"', async () => {
			const message = {
				msg: '#general',
			} as any;
			const expected = [
				{
					_id: '1',
					name: 'general',
				},
			];
			const result = await mention.getChannelbyMentions(message);
			expect(result).toEqual(expected);
		});
		it('should return nothing"', async () => {
			const message = {
				msg: '#unknow',
			} as any;
			const expected = {
				msg: '#unknow',
				mentions: [],
				channels: [],
			};
			const result = await mention.execute(message);
			expect(result).toEqual(expected);
		});
	});

	describe('getUserMentions', () => {
		describe('for message with only an md link', () => {
			const result: string[] = [];
			[
				'[@rocket.cat](https://rocket.chat)',
				'[@rocket.cat](https://rocket.chat) hello',
				'[@rocket.cat](https://rocket.chat) hello how are you?',
				'[test](https://rocket.chat)',
			].forEach((text) => {
				it(`should return "${JSON.stringify(result)}" from "${text}"`, () => {
					expect(mention.getUserMentions(text)).toEqual(result);
				});
			});
		});

		describe('for message with md link and text', () => {
			const result = ['@sauron'];
			[
				'@sauron please work on [user@password](https://rocket.chat)',
				'@sauron hello [user@password](https://rocket.chat) hello',
				'[user@password](https://rocket.chat) hello @sauron',
				'@sauron please work on [user@password](https://rocket.chat) hello',
			].forEach((text) => {
				it(`should return "${JSON.stringify(result)}" from "${text}"`, () => {
					expect(mention.getUserMentions(text)).toEqual(result);
				});
			});
		});
	});

	describe('getChannelMentions', () => {
		describe('for message with md link', () => {
			const result: string[] = [];
			[
				'[#general](https://rocket.chat)',
				'[#general](https://rocket.chat) hello',
				'[#general](https://rocket.chat) hello how are you?',
				'[test #general #other](https://rocket.chat)',
			].forEach((text) => {
				it(`should return "${JSON.stringify(result)}" from "${text}"`, () => {
					expect(mention.getChannelMentions(text)).toEqual(result);
				});
			});
		});

		describe('for message with md link and text', () => {
			const result = ['#somechannel'];
			[
				'#somechannel please [user#password](https://rocket.chat)',
				'#somechannel hello [user#password](https://rocket.chat) hello',
				'[user#password](https://rocket.chat) hello #somechannel',
				'#somechannel join [#general on #other](https://rocket.chat)',
			].forEach((text) => {
				it(`should return "${JSON.stringify(result)}" from "${text}"`, () => {
					expect(mention.getChannelMentions(text)).toEqual(result);
				});
			});
		});
	});
});
