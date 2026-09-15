import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { Streamer, StreamerCentral } from '../../../../../server/modules/streamer/streamer.module';

class TestStreamer extends Streamer<any> {
	registerPublication(): void {
		// noop
	}

	registerMethod(): void {
		// noop
	}

	changedPayload(): string {
		return 'payload';
	}
}
const validateActionStub = sinon.stub();
const processSerializedSignalStub = sinon.stub();
const countByRoomIdAndUserIdStub = sinon.stub();
const findSubscriptionsExcludingUserStub = sinon.stub();

const { NotificationsModule } = proxyquire.noCallThru().load('../../../../../server/modules/notifications/notifications.module', {
	'@rocket.chat/core-services': {
		VideoConf: { validateAction: validateActionStub },
		MediaCall: { processSerializedSignal: processSerializedSignalStub },
	},
	'@rocket.chat/models': {
		Subscriptions: {
			countByRoomIdAndUserId: countByRoomIdAndUserIdStub,
			findByRoomIdAndNotUserId: findSubscriptionsExcludingUserStub,
		},
		Rooms: {},
		Users: {},
	},
});

describe('NotificationsModule', () => {
	let notifications: any;

	beforeEach(() => {
		notifications = new NotificationsModule(TestStreamer as any);
		notifications.configure();
	});

	describe('notify-user allowWrite', () => {
		// `isWriteAllowed` is public on the concrete Streamer class but not on the IStreamer
		// interface that `streamUser` is typed as, so cast to reach it.
		const writeAllowed = (eventName: string, ...args: unknown[]) =>
			(notifications.streamUser as unknown as Streamer<'notify-user'>).isWriteAllowed({ userId: 'userId' } as any, eventName, args);

		beforeEach(() => {
			validateActionStub.reset();
			validateActionStub.resolves(true);
			processSerializedSignalStub.reset();
			processSerializedSignalStub.resolves(undefined);
			countByRoomIdAndUserIdStub.reset();
			findSubscriptionsExcludingUserStub.reset();
		});

		afterEach(() => {
			Object.keys(StreamerCentral.instances).forEach((name) => delete StreamerCentral.instances[name]);
		});

		['force_logout', 'notification', 'message', 'uiInteraction', 'subscriptions-changed', 'webdav', 'banners'].forEach((event) => {
			it(`should deny a logged-in client writing "${event}" to another user's stream`, async () => {
				expect(await writeAllowed(`victim/${event}`, { foo: 'bar' })).to.equal(false);
			});
		});

		it("should deny writes even to the client's own stream", async () => {
			expect(await writeAllowed(`userId/force_logout`, undefined)).to.equal(false);
		});

		it('should accept "video-conference" and delegate authorization to VideoConf.validateAction', async () => {
			const result = await writeAllowed(`userId/video-conference`, {
				action: 'call-start',
				params: { callId: '123', uid: '456', rid: '789' },
			});

			expect(result).to.be.true;
			expect(validateActionStub.calledOnceWith('call-start', 'userId', { callId: '123', uid: '456', rid: '789' })).to.be.true;
		});

		it('should process "media-calls" signals server-side and never broadcast them', async () => {
			const signal = '{"type":"offer"}';
			const result = await writeAllowed(`userId/media-calls`, signal);

			expect(result).to.equal(false);
			expect(processSerializedSignalStub.calledOnceWith('userId', signal)).to.be.true;
		});
	});

	describe('notify-room-users allowWrite', () => {
		const writeAllowed = (eventName: string, ...args: unknown[]) =>
			(notifications.streamRoomUsers as unknown as Streamer<'notify-room-users'>).isWriteAllowed(
				{ userId: 'attacker' } as any,
				eventName,
				args,
			);

		beforeEach(() => {
			countByRoomIdAndUserIdStub.reset();
			countByRoomIdAndUserIdStub.resolves(1); // attacker is subscribed to the room
			findSubscriptionsExcludingUserStub.reset();
			findSubscriptionsExcludingUserStub.returns({ toArray: async () => [{ u: { _id: 'victim' } }] });
		});

		afterEach(() => {
			Object.keys(StreamerCentral.instances).forEach((name) => delete StreamerCentral.instances[name]);
		});

		['force_logout', 'notification', 'message', 'uiInteraction', 'subscriptions-changed', 'webdav', 'banners'].forEach((event) => {
			it(`should deny and not relay an arbitrary "${event}" event to other room members`, async () => {
				const emitSpy = sinon.spy(notifications.streamUser, 'emit');

				const result = await writeAllowed(`room1/${event}`, { foo: 'bar' });

				expect(result).to.equal(false);
				expect(findSubscriptionsExcludingUserStub.called).to.equal(false);
				expect(emitSpy.called).to.equal(false);
			});
		});

		it('should not relay anything for a user not subscribed to the room', async () => {
			countByRoomIdAndUserIdStub.resolves(0);
			const emitSpy = sinon.spy(notifications.streamUser, 'emit');

			const result = await writeAllowed('room1/video-conference', {
				action: 'call-start',
				params: { callId: '123', uid: 'victim', rid: 'room1' },
			});

			expect(result).to.equal(false);
			expect(findSubscriptionsExcludingUserStub.called).to.equal(false);
			expect(emitSpy.called).to.equal(false);
		});

		['video-conference', 'userData'].forEach((event) => {
			it(`should relay "${event}" event to other room members`, async () => {
				const emitSpy = sinon.spy(notifications.streamUser, 'emit');

				const result = await writeAllowed(`room1/${event}`, { foo: 'bar' });

				expect(result).to.equal(false);
				expect(findSubscriptionsExcludingUserStub.called).to.equal(true);
				expect(emitSpy.called).to.equal(true);
			});
		});
	});
});
