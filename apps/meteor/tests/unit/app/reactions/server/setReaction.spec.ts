import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it, vi } from 'vitest';

// Stubs are created in `vi.hoisted` so the (hoisted) `vi.mock` factories can reference them. Because
// the spec asserts with `sinon.match(...)`, which IS cross-sinon-instance-sensitive, `match` is also
// sourced from the hoisted sinon instance (see `match`).
const {
	match,
	meteorMethodsMock,
	emojiList,
	modelsMock,
	messageBeforeReactedMock,
	canAccessRoomAsyncMock,
	isTheLastMessageMock,
	notifyOnMessageChangeMock,
	hasPermissionAsyncMock,
	i18nMock,
	callbacksRunMock,
	meteorErrorMock,
} = vi.hoisted(() => {
	const sinon = require('sinon');
	return {
		match: sinon.match,
		meteorMethodsMock: sinon.stub(),
		emojiList: {} as Record<string, any>,
		modelsMock: {
			EmojiCustom: {
				countByNameOrAlias: sinon.stub(),
			},
			Users: {
				findOneById: sinon.stub(),
			},
			Messages: {
				findOneById: sinon.stub(),
				setReactions: sinon.stub(),
				unsetReactions: sinon.stub(),
			},
			Rooms: {
				findOneById: sinon.stub(),
				unsetReactionsInLastMessage: sinon.stub(),
				setReactionsInLastMessage: sinon.stub(),
			},
		},
		messageBeforeReactedMock: sinon.stub(),
		canAccessRoomAsyncMock: sinon.stub(),
		isTheLastMessageMock: sinon.stub(),
		notifyOnMessageChangeMock: sinon.stub(),
		hasPermissionAsyncMock: sinon.stub(),
		i18nMock: { t: sinon.stub() },
		callbacksRunMock: sinon.stub(),
		meteorErrorMock: class extends Error {
			constructor(message: string) {
				super(message);
			}
		},
	};
});

vi.mock('@rocket.chat/models', () => modelsMock);
vi.mock('@rocket.chat/core-services', () => ({ Message: { beforeReacted: messageBeforeReactedMock } }));
vi.mock('meteor/meteor', () => ({ Meteor: { methods: meteorMethodsMock, Error: meteorErrorMock } }));
vi.mock('../../../../../server/lib/callbacks', () => ({ callbacks: { run: callbacksRunMock } }));
vi.mock('../../../../../server/lib/i18n', () => ({ i18n: i18nMock }));
vi.mock('../../../../../app/authorization/server', () => ({ canAccessRoomAsync: canAccessRoomAsyncMock }));
vi.mock('../../../../../app/authorization/server/functions/hasPermission', () => ({ hasPermissionAsync: hasPermissionAsyncMock }));
vi.mock('../../../../../app/emoji/server', () => ({ emoji: { list: emojiList } }));
vi.mock('../../../../../app/lib/server/functions/isTheLastMessage', () => ({ isTheLastMessage: isTheLastMessageMock }));
vi.mock('../../../../../app/lib/server/lib/notifyListener', () => ({
	notifyOnMessageChange: notifyOnMessageChangeMock,
}));

const { removeUserReaction, executeSetReaction, setReaction } = await import('../../../../../app/reactions/server/setReaction');

describe('Reactions', () => {
	describe('removeUserReaction', () => {
		it('should return the message unmodified when no reactions exist', () => {
			const message = {};

			const result = removeUserReaction(message as any, 'test', 'test');
			expect(result).to.equal(message);
		});
		it('should remove the reaction from a message', () => {
			const message = {
				reactions: {
					test: {
						usernames: ['test', 'test2'],
					},
				},
			};

			const result = removeUserReaction(message as any, 'test', 'test');
			expect(result.reactions!.test.usernames).to.not.include('test');
			expect(result.reactions!.test.usernames).to.include('test2');
		});
		it('should remove the reaction from a message when the user is the last one on the array', () => {
			const message = {
				reactions: {
					test: {
						usernames: ['test'],
					},
				},
			};

			const result = removeUserReaction(message as any, 'test', 'test');
			expect(result.reactions!.test).to.be.undefined;
		});
		it('should remove username only from the reaction thats passed in', () => {
			const message = {
				reactions: {
					test: {
						usernames: ['test', 'test2'],
					},
					other: {
						usernames: ['test', 'test2'],
					},
				},
			};

			const result = removeUserReaction(message as any, 'test', 'test');
			expect(result.reactions!.test.usernames).to.not.include('test');
			expect(result.reactions!.test.usernames).to.include('test2');
			expect(result.reactions!.other.usernames).to.include('test');
			expect(result.reactions!.other.usernames).to.include('test2');
		});
		it('should do nothing if username is not in the reaction', () => {
			const message = {
				reactions: {
					test: {
						usernames: ['test', 'test2'],
					},
				},
			};

			const result = removeUserReaction(message as any, 'test', 'test3');
			expect(result.reactions!.test.usernames).to.not.include('test3');
			expect(result.reactions!.test.usernames).to.include('test');
			expect(result.reactions!.test.usernames).to.include('test2');
		});
	});
	describe('executeSetReaction', () => {
		beforeEach(() => {
			modelsMock.EmojiCustom.countByNameOrAlias.reset();
		});
		it('should throw an error if reaction is not on emojione list', async () => {
			modelsMock.EmojiCustom.countByNameOrAlias.resolves(0);
			await expect(executeSetReaction('test', 'test', 'test')).to.be.rejectedWith('error-not-allowed');
		});
		it('should fail if user does not exist', async () => {
			modelsMock.EmojiCustom.countByNameOrAlias.resolves(1);
			await expect(executeSetReaction('test', 'test', 'test')).to.be.rejectedWith('error-invalid-user');
		});
		it('should fail if message does not exist', async () => {
			modelsMock.EmojiCustom.countByNameOrAlias.resolves(1);
			modelsMock.Users.findOneById.resolves({ username: 'test' });
			await expect(executeSetReaction('test', 'test', 'test')).to.be.rejectedWith('error-not-allowed');
		});
		it('should return nothing if user already reacted and its trying to react again', async () => {
			modelsMock.EmojiCustom.countByNameOrAlias.resolves(1);
			modelsMock.Users.findOneById.resolves({ username: 'test' });
			modelsMock.Messages.findOneById.resolves({ reactions: { ':test:': { usernames: ['test'] } } });
			expect(await executeSetReaction('test', 'test', 'test', true)).to.be.undefined;
		});
		it('should return nothing if user hasnt reacted and its trying to unreact', async () => {
			modelsMock.EmojiCustom.countByNameOrAlias.resolves(1);
			modelsMock.Users.findOneById.resolves({ username: 'test' });
			modelsMock.Messages.findOneById.resolves({ reactions: { ':test:': { usernames: ['testxxxx'] } } });
			expect(await executeSetReaction('test', 'test', 'test', false)).to.be.undefined;
		});
		it('should fail if room does not exist', async () => {
			modelsMock.EmojiCustom.countByNameOrAlias.resolves(1);
			modelsMock.Users.findOneById.resolves({ username: 'test' });
			modelsMock.Messages.findOneById.resolves({ reactions: { ':test:': { usernames: ['test'] } } });
			modelsMock.Rooms.findOneById.resolves(undefined);
			await expect(executeSetReaction('test', 'test', 'test')).to.be.rejectedWith('error-not-allowed');
		});
		it('should fail if user doesnt have acccess to the room', async () => {
			modelsMock.EmojiCustom.countByNameOrAlias.resolves(1);
			modelsMock.Users.findOneById.resolves({ username: 'test' });
			modelsMock.Messages.findOneById.resolves({ reactions: { ':test:': { usernames: ['test'] } } });
			modelsMock.Rooms.findOneById.resolves({ t: 'd' });
			canAccessRoomAsyncMock.resolves(false);
			await expect(executeSetReaction('test', 'test', 'test')).to.be.rejectedWith('not-authorized');
		});
		it('should call setReaction with correct params', async () => {
			modelsMock.EmojiCustom.countByNameOrAlias.resolves(1);
			modelsMock.Users.findOneById.resolves({ username: 'test' });
			modelsMock.Messages.findOneById.resolves({ reactions: { ':test:': { usernames: ['test'] } } });
			modelsMock.Rooms.findOneById.resolves({ t: 'c' });
			canAccessRoomAsyncMock.resolves(true);

			const res = await executeSetReaction('test', 'test', 'test');
			expect(res).to.be.undefined;
		});
		it('should use the message from param when the type is not an string', async () => {
			modelsMock.EmojiCustom.countByNameOrAlias.resolves(1);
			modelsMock.Users.findOneById.resolves({ username: 'test' });
			modelsMock.Rooms.findOneById.resolves({ t: 'c' });
			canAccessRoomAsyncMock.resolves(true);

			await executeSetReaction('test', 'test', { reactions: { ':test:': { usernames: ['test'] } } } as unknown as IMessage);
			expect(modelsMock.Messages.findOneById.calledOnce).to.be.false;
		});
	});
	describe('setReaction', () => {
		beforeEach(() => {
			canAccessRoomAsyncMock.reset();
			hasPermissionAsyncMock.reset();
			isTheLastMessageMock.reset();
			modelsMock.Messages.setReactions.reset();
			modelsMock.Rooms.setReactionsInLastMessage.reset();
			modelsMock.Rooms.unsetReactionsInLastMessage.reset();
			modelsMock.Messages.unsetReactions.reset();
			callbacksRunMock.reset();
		});
		it('should throw an error if user is muted from the room', async () => {
			const room = {
				muted: ['test'],
			};
			const user = {
				username: 'test',
			};
			const message = {
				_id: 'test',
			};
			await expect(
				setReaction(room as unknown as IRoom, user as unknown as IUser, message as unknown as IMessage, ':test:'),
			).to.be.rejectedWith('error-not-allowed');
		});
		it('should throw an error if room is readonly and cannot be reacted when readonly and user trying doesnt have permissions and user is not unmuted from room', async () => {
			const room = {
				ro: true,
				reactWhenReadOnly: false,
			};
			const user = {
				username: 'test',
			};
			const message = {
				_id: 'test',
			};
			canAccessRoomAsyncMock.resolves(false);
			await expect(
				setReaction(room as unknown as IRoom, user as unknown as IUser, message as unknown as IMessage, ':test:'),
			).to.be.rejectedWith("You can't send messages because the room is readonly.");
		});
		it('should remove the user reaction if userAlreadyReacted is true and call unsetReaction if reaction is the last one on message', async () => {
			const room = {
				_id: 'test',
			};
			const user = {
				username: 'test',
			};
			const message = {
				_id: 'test',
				reactions: {
					':test:': {
						usernames: ['test'],
					},
				},
			};
			const reaction = ':test:';

			await setReaction(room as unknown as IRoom, user as unknown as IUser, message as unknown as IMessage, reaction, true);
			expect(modelsMock.Messages.unsetReactions.calledWith(message._id)).to.be.true;
		});
		it('should call Rooms.unsetReactionsInLastMessage when userAlreadyReacted is true and reaction is the last one on message', async () => {
			const room = {
				_id: 'test',
				lastMessage: 'test',
			};
			const user = {
				username: 'test',
			};
			const message = {
				_id: 'test',
				reactions: {
					':test:': {
						usernames: ['test'],
					},
				},
			};
			const reaction = ':test:';

			isTheLastMessageMock.resolves(true);

			await setReaction(room as unknown as IRoom, user as unknown as IUser, message as unknown as IMessage, reaction, true);
			expect(modelsMock.Messages.unsetReactions.calledWith(message._id)).to.be.true;
			expect(modelsMock.Rooms.unsetReactionsInLastMessage.calledWith(room._id)).to.be.true;
		});
		it('should update the reactions object when userAlreadyReacted is true and there is more reactions on message', async () => {
			const room = {
				_id: 'test',
			};
			const user = {
				username: 'test',
			};
			const message = {
				_id: 'test',
				reactions: {
					':test:': {
						usernames: ['test'],
					},
					':test2:': {
						usernames: ['test'],
					},
				},
			};
			const reaction = ':test:';

			await setReaction(room as unknown as IRoom, user as unknown as IUser, message as unknown as IMessage, reaction, true);
			expect(modelsMock.Messages.setReactions.calledWith(message._id, match({ ':test2:': { usernames: ['test'] } }))).to.be.true;
		});
		it('should call Rooms.setReactionsInLastMessage when userAlreadyReacted is true and reaction is not the last one on message', async () => {
			const room = {
				_id: 'test',
				lastMessage: 'test',
			};
			const user = {
				username: 'test',
			};
			const message = {
				_id: 'test',
				reactions: {
					':test:': {
						usernames: ['test'],
					},
					':test2:': {
						usernames: ['test'],
					},
				},
			};
			const reaction = ':test:';

			isTheLastMessageMock.resolves(true);

			await setReaction(room as unknown as IRoom, user as unknown as IUser, message as unknown as IMessage, reaction, true);
			expect(modelsMock.Messages.setReactions.calledWith(message._id, match({ ':test2:': { usernames: ['test'] } }))).to.be.true;
			expect(modelsMock.Rooms.setReactionsInLastMessage.calledWith(room._id, match({ ':test2:': { usernames: ['test'] } }))).to.be.true;
		});
		it('should call afterUnsetReaction callback when userAlreadyReacted is true', async () => {
			const room = {
				_id: 'test',
			};
			const user = {
				username: 'test',
			};
			const message = {
				_id: 'test',
				reactions: {
					':test:': {
						usernames: ['test'],
					},
				},
			};
			const reaction = ':test:';

			await setReaction(room as unknown as IRoom, user as unknown as IUser, message as unknown as IMessage, reaction, true);
			expect(
				callbacksRunMock.calledWith(
					'afterUnsetReaction',
					match({ _id: 'test' }),
					match({ user, reaction, shouldReact: false, oldMessage: message }),
				),
			).to.be.true;
		});
		it('should set reactions when userAlreadyReacted is false', async () => {
			const room = {
				_id: 'test',
			};
			const user = {
				username: 'test',
			};
			const message = {
				_id: 'test',
			};
			const reaction = ':test:';
			await setReaction(room as unknown as IRoom, user as unknown as IUser, message as unknown as IMessage, reaction, false);
			expect(modelsMock.Messages.setReactions.calledWith(message._id, match({ ':test:': { usernames: ['test'] } }))).to.be.true;
		});
		it('should properly add username to the list of reactions when userAlreadyReacted is false', async () => {
			const room = {
				_id: 'test',
			};
			const user = {
				username: 'test2',
			};
			const message = {
				_id: 'test',
				reactions: {
					':test:': {
						usernames: ['test'],
					},
				},
			};
			const reaction = ':test:';

			await setReaction(room as unknown as IRoom, user as unknown as IUser, message as unknown as IMessage, reaction, false);
			expect(modelsMock.Messages.setReactions.calledWith(message._id, match({ ':test:': { usernames: ['test', 'test2'] } }))).to.be.true;
		});
		it('should call Rooms.setReactionInLastMessage when userAlreadyReacted is false', async () => {
			const room = {
				_id: 'x5',
				lastMessage: 'test',
			};
			const user = {
				username: 'test',
			};
			const message = {
				_id: 'test',
			};
			const reaction = ':test:';

			isTheLastMessageMock.resolves(true);

			await setReaction(room as unknown as IRoom, user as unknown as IUser, message as unknown as IMessage, reaction, false);
			expect(modelsMock.Messages.setReactions.calledWith(message._id, match({ ':test:': { usernames: ['test'] } }))).to.be.true;
			expect(modelsMock.Rooms.setReactionsInLastMessage.calledWith(room._id, match({ ':test:': { usernames: ['test'] } }))).to.be.true;
		});
		it('should call afterSetReaction callback when userAlreadyReacted is false', async () => {
			const room = {
				_id: 'test',
			};
			const user = {
				username: 'test',
			};
			const message = {
				_id: 'test',
			};
			const reaction = ':test:';

			await setReaction(room as unknown as IRoom, user as unknown as IUser, message as unknown as IMessage, reaction, false);
			expect(callbacksRunMock.calledWith('afterSetReaction', match({ _id: 'test' }), match({ user, reaction, shouldReact: true }))).to.be
				.true;
		});
		it('should return undefined on a successful reaction', async () => {
			const room = {
				_id: 'test',
			};
			const user = {
				username: 'test',
			};
			const message = {
				_id: 'test',
			};
			const reaction = ':test:';

			expect(await setReaction(room as unknown as IRoom, user as unknown as IUser, message as unknown as IMessage, reaction, false)).to.be
				.undefined;
		});
	});
});
