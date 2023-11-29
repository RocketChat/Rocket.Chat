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

const createRoom = (): any => ({
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
});

describe('Create attachments for message URLs', () => {
	it('should return message without attatchment and URLs if no URL provided', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessage: async () => createMessage('linked message', { _id: 'linked' }),
			getRoom: async () => createRoom(),
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

	it('should return an attachment with the message content if a message URL is provided', async () => {
		const jumpToMessage = new BeforeSaveJumpToMessage({
			getMessage: async () => createMessage('linked message', { _id: 'linked' }),

			getRoom: async () => createRoom(),

			canAccessRoom: async () => true,

			getUserAvatarURL: () => 'url',
		});

		const message = await jumpToMessage.createAttachmentForMessageURLs({
			message: createMessage('hey', { urls: [{ url: 'https://open.rocket.chat/linked?msg=linkedMsgId' }] }),
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
			url: 'https://open.rocket.chat/linked?msg=linkedMsgId',
			ignoreParse: true,
		});

		expect(message).to.have.property('attachments').and.to.have.lengthOf(1);

		const [attachment] = message.attachments ?? [];

		expect(attachment).to.have.property('text', 'linked message');
	});
});
