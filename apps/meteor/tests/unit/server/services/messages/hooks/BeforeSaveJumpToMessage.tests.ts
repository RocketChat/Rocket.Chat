import { expect } from 'chai';

import { BeforeSaveJumpToMessage } from '../../../../../../server/services/messages/hooks/BeforeSaveJumpToMessage';

const createMessage = (msg?: string, extra: any = {}) => ({
	_id: 'random',
	rid: 'GENERAL',
	ts: new Date(),
	u: {
		_id: 'userId',
		username: 'username',
	},
	_updatedAt: new Date(),
	msg: msg as string,
	...extra,
});

const createUser = (username?: string) => ({
	_id: 'userId',
	username,
	name: 'name',
	language: 'en',
});

const createRoom = (extra: any = {}): any => ({
	_id: 'GENERAL',
	t: 'c',
	u: {
		_id: 'userId',
		username: 'username',
		name: 'name',
	},
	msgs: 1,
	usersCount: 1,
	_updatedAt: new Date(),
	...extra,
});

const countDeep = (msg: any, deep = 1): number => {
	if (!msg) {
		return deep - 1;
	}

	if (Array.isArray(msg?.attachments) && msg.attachments.length > 0) {
		return msg.attachments.reduce((count: number, att: any) => Math.max(countDeep(att, deep + 1), count), 0);
	}

	return deep - 1;
};

describe('Create attachments for message URLs', () => {
	it('should return message without attatchment and URLs if no URL provided', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessages: async () => [createMessage('linked message', { _id: 'linked' })],
			getRooms: async () => [createRoom()],
			canAccessRoom: async () => true,
			getUserAvatarURL: () => 'url',
		});

		const message = await jumpToMessage.createAttachmentForMessageURLs({
			message: createMessage('hey'),
			user: createUser(),
			config: {
				chainLimit: 10,
				siteUrl: 'https://open.rocket.chat',
				useRealName: true,
			},
		});

		return expect(message).to.not.have.property('urls');
	});

	it('should do nothing if URL is not from SiteUrl', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessages: async () => [createMessage('linked message', { _id: 'linked' })],
			getRooms: async () => [createRoom()],
			canAccessRoom: async () => true,
			getUserAvatarURL: () => 'url',
		});

		const message = await jumpToMessage.createAttachmentForMessageURLs({
			message: createMessage('hey', { urls: [{ url: 'https://google.com' }] }),
			user: createUser(),
			config: {
				chainLimit: 10,
				siteUrl: 'https://open.rocket.chat',
				useRealName: true,
			},
		});

		expect(message).to.have.property('urls').of.length(1);
		expect(message).to.not.have.property('attachments');
	});

	it('should do nothing if URL is from SiteUrl but not have a query string', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessages: async () => [createMessage('linked message', { _id: 'linked' })],
			getRooms: async () => [createRoom()],
			canAccessRoom: async () => true,
			getUserAvatarURL: () => 'url',
		});

		const message = await jumpToMessage.createAttachmentForMessageURLs({
			message: createMessage('hey', { urls: [{ url: 'https://open.rocket.chat' }] }),
			user: createUser(),
			config: {
				chainLimit: 10,
				siteUrl: 'https://open.rocket.chat',
				useRealName: true,
			},
		});

		expect(message).to.have.property('urls').of.length(1);
		expect(message).to.not.have.property('attachments');
	});

	it('should do nothing if URL is from SiteUrl but not have a msgId query string', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessages: async () => [createMessage('linked message', { _id: 'linked' })],
			getRooms: async () => [createRoom()],
			canAccessRoom: async () => true,
			getUserAvatarURL: () => 'url',
		});

		const message = await jumpToMessage.createAttachmentForMessageURLs({
			message: createMessage('hey', { urls: [{ url: 'https://open.rocket.chat/?token=value' }] }),
			user: createUser(),
			config: {
				chainLimit: 10,
				siteUrl: 'https://open.rocket.chat',
				useRealName: true,
			},
		});

		expect(message).to.have.property('urls').of.length(1);
		expect(message).to.not.have.property('attachments');
	});

	it('should do nothing if it do not find a msg from the URL', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessages: async () => [],
			getRooms: async () => [createRoom()],
			canAccessRoom: async () => true,
			getUserAvatarURL: () => 'url',
		});

		const message = await jumpToMessage.createAttachmentForMessageURLs({
			message: createMessage('hey', { urls: [{ url: 'https://open.rocket.chat/?msg=value' }] }),
			user: createUser(),
			config: {
				chainLimit: 10,
				siteUrl: 'https://open.rocket.chat',
				useRealName: true,
			},
		});

		expect(message).to.have.property('urls').of.length(1);
		expect(message).to.not.have.property('attachments');
	});

	it('should do nothing if it cannot find the room of the message from the URL', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessages: async () => [createMessage('linked message', { _id: 'linked' })],
			getRooms: async () => [],
			canAccessRoom: async () => true,
			getUserAvatarURL: () => 'url',
		});

		const message = await jumpToMessage.createAttachmentForMessageURLs({
			message: createMessage('hey', { urls: [{ url: 'https://open.rocket.chat/?msg=value' }] }),
			user: createUser(),
			config: {
				chainLimit: 10,
				siteUrl: 'https://open.rocket.chat',
				useRealName: true,
			},
		});

		expect(message).to.have.property('urls').of.length(1);
		expect(message).to.not.have.property('attachments');
	});

	it('should do nothing if user dont have access to the room of the message from the URL', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessages: async () => [createMessage('linked message', { _id: 'linked' })],
			getRooms: async () => [createRoom()],
			canAccessRoom: async () => false,
			getUserAvatarURL: () => 'url',
		});

		const message = await jumpToMessage.createAttachmentForMessageURLs({
			message: createMessage('hey', { urls: [{ url: 'https://open.rocket.chat/?msg=value' }] }),
			user: createUser(),
			config: {
				chainLimit: 10,
				siteUrl: 'https://open.rocket.chat',
				useRealName: true,
			},
		});

		expect(message).to.have.property('urls').of.length(1);
		expect(message).to.not.have.property('attachments');
	});

	it('should remove other attachments from the message if message_link is the same as the URL', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessages: async () => [createMessage('linked message', { _id: 'linked' })],
			getRooms: async () => [createRoom()],
			canAccessRoom: async () => true,
			getUserAvatarURL: () => 'url',
		});

		const message = await jumpToMessage.createAttachmentForMessageURLs({
			message: createMessage('hey', {
				urls: [{ url: 'https://open.rocket.chat/linked?msg=linked' }],
				attachments: [
					{
						text: 'old attachment',
						author_name: 'username',
						author_icon: 'url',
						message_link: 'https://open.rocket.chat/linked?msg=linked',
						ts: new Date(),
					},
				],
			}),
			user: createUser(),
			config: {
				chainLimit: 10,
				siteUrl: 'https://open.rocket.chat',
				useRealName: true,
			},
		});

		expect(message).to.have.property('urls').and.to.have.lengthOf(1);

		const [url] = message.urls ?? [];

		expect(url).to.include({
			url: 'https://open.rocket.chat/linked?msg=linked',
			ignoreParse: true,
		});

		expect(message).to.have.property('attachments').and.to.have.lengthOf(1);

		const [attachment] = message.attachments ?? [];

		expect(attachment).to.have.property('text', 'linked message');
	});

	it('should return an attachment with the message content if a message URL is provided', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessages: async () => [createMessage('linked message', { _id: 'linked' })],
			getRooms: async () => [createRoom()],
			canAccessRoom: async () => true,
			getUserAvatarURL: () => 'url',
		});

		const message = await jumpToMessage.createAttachmentForMessageURLs({
			message: createMessage('hey', { urls: [{ url: 'https://open.rocket.chat/linked?msg=linked' }] }),
			user: createUser(),
			config: {
				chainLimit: 10,
				siteUrl: 'https://open.rocket.chat',
				useRealName: true,
			},
		});

		expect(message).to.have.property('urls').and.to.have.lengthOf(1);

		const [url] = message.urls ?? [];

		expect(url).to.include({
			url: 'https://open.rocket.chat/linked?msg=linked',
			ignoreParse: true,
		});

		expect(message).to.have.property('attachments').and.to.have.lengthOf(1);

		const [attachment] = message.attachments ?? [];

		expect(attachment).to.have.property('text', 'linked message');
	});

	it('should respect chain limit config', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessages: async () => [
				createMessage('linked message', {
					_id: 'linked',
					attachments: [
						{
							text: 'chained 1',
							author_name: 'username',
							author_icon: 'url',
							ts: new Date(),
							message_link: 'https://open.rocket.chat/linked?msg=linkedMsgId',
							attachments: [
								{
									text: 'chained 2',
									author_name: 'username',
									author_icon: 'url',
									message_link: 'https://open.rocket.chat/linked?msg=linkedMsgId',
									ts: new Date(),
									attachments: [
										{
											text: 'chained 3',
											author_name: 'username',
											author_icon: 'url',
											message_link: 'https://open.rocket.chat/linked?msg=linkedMsgId',
											ts: new Date(),
										},
									],
								},
							],
						},
					],
				}),
			],
			getRooms: async () => [createRoom()],
			canAccessRoom: async () => true,
			getUserAvatarURL: () => 'url',
		});

		const message = await jumpToMessage.createAttachmentForMessageURLs({
			message: createMessage('hey', {
				urls: [{ url: 'https://open.rocket.chat/linked?msg=linked' }],
			}),
			user: createUser(),
			config: {
				chainLimit: 3,
				siteUrl: 'https://open.rocket.chat',
				useRealName: true,
			},
		});

		expect(message).to.have.property('urls').and.to.have.lengthOf(1);
		expect(message).to.have.property('attachments').and.to.have.lengthOf(1);

		const deep = countDeep(message);
		expect(deep).to.be.eq(3);
	});

	it('should create the attachment if cannot access room but message has a livechat token', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessages: async () => [createMessage('linked message', { _id: 'linked' })],
			getRooms: async () => [createRoom({ t: 'l', v: { token: 'livechatToken' } })],
			canAccessRoom: async () => false,
			getUserAvatarURL: () => 'url',
		});

		const message = await jumpToMessage.createAttachmentForMessageURLs({
			message: createMessage('hey', {
				urls: [{ url: 'https://open.rocket.chat/linked?msg=linked' }],
				token: 'livechatToken',
			}),
			user: createUser(),
			config: {
				chainLimit: 10,
				siteUrl: 'https://open.rocket.chat',
				useRealName: true,
			},
		});

		expect(message).to.have.property('urls').and.to.have.lengthOf(1);

		const [url] = message.urls ?? [];

		expect(url).to.include({
			url: 'https://open.rocket.chat/linked?msg=linked',
			ignoreParse: true,
		});

		expect(message).to.have.property('attachments').and.to.have.lengthOf(1);

		const [attachment] = message.attachments ?? [];

		expect(attachment).to.have.property('text', 'linked message');
	});

	it('should do nothing if cannot access room but message has a livechat token but is not from the room does not have a token', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessages: async () => [createMessage('linked message', { _id: 'linked' })],
			getRooms: async () => [createRoom({ t: 'l' })],
			canAccessRoom: async () => false,
			getUserAvatarURL: () => 'url',
		});

		const message = await jumpToMessage.createAttachmentForMessageURLs({
			message: createMessage('hey', {
				urls: [{ url: 'https://open.rocket.chat/linked?msg=linked' }],
				token: 'another-token',
			}),
			user: createUser(),
			config: {
				chainLimit: 10,
				siteUrl: 'https://open.rocket.chat',
				useRealName: true,
			},
		});

		expect(message).to.have.property('urls').and.to.have.lengthOf(1);
		expect(message).to.not.have.property('attachments');
	});

	it('should remove the clean up the attachments of the quoted message property if chain limit < 2', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessages: async () => [
				createMessage('linked message', {
					_id: 'linkedMsgId',
					attachments: [
						{
							text: 'chained 1',
							author_name: 'username',
							author_icon: 'url',
							ts: new Date(),
						},
					],
				}),
			],
			getRooms: async () => [createRoom()],
			canAccessRoom: async () => true,
			getUserAvatarURL: () => 'url',
		});

		const message = await jumpToMessage.createAttachmentForMessageURLs({
			message: createMessage('hey', {
				urls: [{ url: 'https://open.rocket.chat/linked?msg=linkedMsgId' }],
			}),
			user: createUser(),
			config: {
				chainLimit: 1,
				siteUrl: 'https://open.rocket.chat',
				useRealName: true,
			},
		});

		expect(message).to.have.property('urls').and.to.have.lengthOf(1);
		expect(message).to.have.property('attachments').and.to.have.lengthOf(1);

		const deep = countDeep(message);
		expect(deep).to.be.eq(1);

		const [attachment] = message.attachments ?? [];

		expect(attachment).to.have.property('attachments').and.to.have.lengthOf(0);
		expect(attachment).to.include({
			text: 'linked message',
			author_name: 'username',
			author_icon: 'url',
			message_link: 'https://open.rocket.chat/linked?msg=linkedMsgId',
		});
	});

	it('should work for multiple URLs', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessages: async () => {
				return [
					createMessage('first message', {
						_id: 'msg1',
					}),
					createMessage('second message', {
						_id: 'msg2',
					}),
				];
			},
			getRooms: async () => [createRoom()],
			canAccessRoom: async () => true,
			getUserAvatarURL: () => 'url',
		});

		const message = await jumpToMessage.createAttachmentForMessageURLs({
			message: createMessage('hey', {
				urls: [{ url: 'https://open.rocket.chat/linked?msg=msg1' }, { url: 'https://open.rocket.chat/linked?msg=msg2' }],
			}),
			user: createUser(),
			config: {
				chainLimit: 1,
				siteUrl: 'https://open.rocket.chat',
				useRealName: true,
			},
		});

		expect(message).to.have.property('urls').and.to.have.lengthOf(2);
		expect(message).to.have.property('attachments').and.to.have.lengthOf(2);

		const deep = countDeep(message);
		expect(deep).to.be.eq(1);

		const [att1, att2] = message.attachments ?? [];

		expect(att1).to.include({
			text: 'first message',
			message_link: 'https://open.rocket.chat/linked?msg=msg1',
		});

		expect(att2).to.include({
			text: 'second message',
			message_link: 'https://open.rocket.chat/linked?msg=msg2',
		});
	});
});
