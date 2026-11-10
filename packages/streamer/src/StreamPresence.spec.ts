import { LocalBroker, ServiceClass, api } from '@rocket.chat/core-services';
import type { IStatusVisibilityService, PresenceScope } from '@rocket.chat/core-services';
import { USER_STATUS_TO_PRESENCE_CODE, UserStatus } from '@rocket.chat/core-typings';

import { StreamPresence, emit, refreshVisibility } from './StreamPresence';
import { Streamer } from './streamer.module';
import type { IPublication } from './types';

class TestStreamer extends Streamer<any> {
	registerPublication(): void {
		// no-op for unit test subclass
	}

	registerMethod(): void {
		// no-op for unit test subclass
	}

	changedPayload(_collection: string, _id: string, fields: Record<string, any>): string {
		return JSON.stringify(fields);
	}
}

const getHiddenFrom = jest.fn<Promise<PresenceScope>, [string | null | undefined]>();

class StatusVisibilityDouble extends ServiceClass implements Pick<IStatusVisibilityService, 'getHiddenFrom'> {
	protected name = 'status-visibility';

	async getHiddenFrom(viewerId: string | null | undefined): Promise<PresenceScope> {
		return getHiddenFrom(viewerId);
	}
}

const services = [new StatusVisibilityDouble()];

const ONLINE = USER_STATUS_TO_PRESENCE_CODE[UserStatus.ONLINE];
const OFFLINE = USER_STATUS_TO_PRESENCE_CODE[UserStatus.OFFLINE];
const NOTHING_HIDDEN: PresenceScope = { hideAll: false };
const hiding = (...hidden: string[]): PresenceScope => ({ hideAll: false, hidden });

const stream = StreamPresence.getInstance(TestStreamer as any) as unknown as {
	_publish(publication: IPublication, eventName: string, options: { added?: string[]; removed?: string[] }): Promise<void>;
};

const stops: (() => void)[] = [];

const connectViewer = (userId: string) => {
	const send = jest.fn();
	const session = { userId, socket: { send } };
	const connection = { id: `connection-${userId}` };

	const publish = (options: { added?: string[]; removed?: string[] }) => {
		const publication = {
			connection,
			_session: session as typeof session | null,
			_isDeactivated: () => publication._session === null,
			ready: jest.fn(),
			stop: jest.fn(),
			onStop: (stop: () => void) => stops.push(stop),
		};
		return { publication, done: stream._publish(publication as unknown as IPublication, 'user-presence', options) };
	};

	const statusesOf = (uid: string) =>
		send.mock.calls
			.map(([payload]) => JSON.parse(payload))
			.filter((sent) => sent.uid === uid)
			.map(({ args }) => args[0][1]);

	return { publish, statusesOf, session };
};

const subscribe = async (viewer: ReturnType<typeof connectViewer>, added: string[]) => {
	const { publication, done } = viewer.publish({ added });
	await done;
	return publication;
};

describe('StreamPresence', () => {
	beforeAll(() => {
		api.setBroker(new LocalBroker());
		services.forEach((service) => api.registerService(service));
	});

	afterAll(async () => {
		await Promise.all(services.map((service) => api.destroyService(service)));
	});

	beforeEach(() => {
		getHiddenFrom.mockReset();
		getHiddenFrom.mockResolvedValue(NOTHING_HIDDEN);
	});

	afterEach(() => stops.splice(0).forEach((stop) => stop()));

	it('sends each status update of a visible user once and unchanged', async () => {
		const viewer = connectViewer('viewer');
		await subscribe(viewer, ['alice']);
		await viewer.publish({ added: ['alice'] }).done;

		emit('alice', [['alice', ONLINE]]);

		expect(viewer.statusesOf('alice')).toEqual([ONLINE]);
	});

	it('sends one offline update for a user newly hidden from the viewer, and then nothing more for that user', async () => {
		const viewer = connectViewer('viewer');
		await subscribe(viewer, ['alice']);

		getHiddenFrom.mockResolvedValue(hiding('alice'));
		await refreshVisibility(['viewer']);
		emit('alice', [['alice', ONLINE]]);
		emit('alice', [['alice', ONLINE]]);
		await refreshVisibility(['viewer']);
		emit('alice', [['alice', ONLINE]]);

		expect(viewer.statusesOf('alice')).toEqual([OFFLINE]);
	});

	it('sends the status updates again after the restriction is removed', async () => {
		getHiddenFrom.mockResolvedValue(hiding('alice'));
		const viewer = connectViewer('viewer');
		await subscribe(viewer, ['alice']);
		emit('alice', [['alice', ONLINE]]);

		getHiddenFrom.mockResolvedValue(NOTHING_HIDDEN);
		await refreshVisibility(['viewer']);
		emit('alice', [['alice', ONLINE]]);

		expect(viewer.statusesOf('alice')).toEqual([OFFLINE, ONLINE]);
	});

	it('sends nothing for a user the viewer unsubscribed from, and nothing after the subscription stops', async () => {
		const viewer = connectViewer('viewer');
		await subscribe(viewer, ['alice', 'bob']);

		await viewer.publish({ removed: ['alice'] }).done;
		emit('alice', [['alice', ONLINE]]);
		emit('bob', [['bob', ONLINE]]);
		stops.splice(0).forEach((stop) => stop());
		emit('bob', [['bob', ONLINE]]);

		expect(viewer.statusesOf('alice')).toEqual([]);
		expect(viewer.statusesOf('bob')).toEqual([ONLINE]);
	});

	it('sends nothing to a viewer who disconnects during the first visibility check, and does not keep the subscription open', async () => {
		const viewer = connectViewer('viewer');
		const { publication, done } = viewer.publish({ added: ['alice'] });
		getHiddenFrom.mockImplementationOnce(async () => {
			publication._session = null;
			return NOTHING_HIDDEN;
		});
		await done;
		emit('alice', [['alice', ONLINE]]);

		const reconnected = await subscribe(viewer, ['alice']);

		expect(publication.ready).not.toHaveBeenCalled();
		expect(viewer.statusesOf('alice')).toEqual([]);
		expect(reconnected.ready).toHaveBeenCalled();
	});

	it('sends nothing to a viewer whose connection dropped, and still sends to the other viewers', async () => {
		const dropped = connectViewer('dropped');
		const other = connectViewer('other');
		await subscribe(dropped, ['alice']);
		await subscribe(other, ['alice']);

		dropped.session.socket = null as unknown as typeof dropped.session.socket;
		emit('alice', [['alice', ONLINE]]);

		expect(dropped.statusesOf('alice')).toEqual([]);
		expect(other.statusesOf('alice')).toEqual([ONLINE]);
	});

	it('reloads the visibility of every viewer when a visibility setting changes', async () => {
		const first = connectViewer('first');
		const second = connectViewer('second');
		await subscribe(first, ['alice']);
		await subscribe(second, ['alice']);

		getHiddenFrom.mockResolvedValue(hiding('alice'));
		await refreshVisibility();
		emit('alice', [['alice', ONLINE]]);

		expect(first.statusesOf('alice')).toEqual([OFFLINE]);
		expect(second.statusesOf('alice')).toEqual([OFFLINE]);
	});

	it('still reloads the other viewers when the visibility reload of one viewer fails', async () => {
		const failing = connectViewer('failing');
		const other = connectViewer('other');
		await subscribe(failing, ['alice']);
		await subscribe(other, ['alice']);

		getHiddenFrom.mockImplementation(async (viewerId) => {
			if (viewerId === 'failing') {
				throw new Error('lookup failed');
			}
			return hiding('alice');
		});
		await refreshVisibility();
		emit('alice', [['alice', ONLINE]]);

		expect(other.statusesOf('alice')).toEqual([OFFLINE]);
	});

	it('refuses the subscription when the first visibility check fails, and accepts a later retry', async () => {
		getHiddenFrom.mockRejectedValueOnce(new Error('lookup failed'));
		const viewer = connectViewer('viewer');
		const { publication, done } = viewer.publish({ added: ['alice'] });

		await expect(done).rejects.toThrow('lookup failed');
		emit('alice', [['alice', ONLINE]]);
		const retried = await subscribe(viewer, ['alice']);

		expect(publication.ready).not.toHaveBeenCalled();
		expect(viewer.statusesOf('alice')).toEqual([]);
		expect(retried.ready).toHaveBeenCalled();
	});
});
