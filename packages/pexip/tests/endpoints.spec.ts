const findOneByProviderNameAndSipAlias = jest.fn();
const findOneById = jest.fn();
const increaseSipParticipantCount = jest.fn();
const increaseWebRTCParticipantCount = jest.fn();
const setStatus = jest.fn();
const recordProviderParticipant = jest.fn();
const setProviderParticipantWaiting = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	VideoConference: {
		findOneByProviderNameAndSipAlias: (...args: unknown[]) => findOneByProviderNameAndSipAlias(...args),
		findOneById: (...args: unknown[]) => findOneById(...args),
		increaseSipParticipantCount: (...args: unknown[]) => increaseSipParticipantCount(...args),
		increaseWebRTCParticipantCount: (...args: unknown[]) => increaseWebRTCParticipantCount(...args),
	},
}));

jest.mock('@rocket.chat/core-services', () => ({
	VideoConf: {
		setStatus: (...args: unknown[]) => setStatus(...args),
		recordProviderParticipant: (...args: unknown[]) => recordProviderParticipant(...args),
		setProviderParticipantWaiting: (...args: unknown[]) => setProviderParticipantWaiting(...args),
	},
}));

// eslint-disable-next-line import-x/first -- the mocks above must be registered before the modules under test
import { EventSinkEndpoint } from '../src/endpoints/eventSink';
// eslint-disable-next-line import-x/first
import { ServerConfigurationEndpoint } from '../src/endpoints/serviceConfiguration';

const pins = { host: '', guest: '', skipForSip: false };

const pexip = {
	settings: {
		pins,
		customization: { locked: true, themeName: 'rocket.chat', meetingLayout: 'one_main_seven_pips', overlayText: true },
	},
	createAndStorePinsForCall: jest.fn().mockResolvedValue(['1234', '5678']),
} as never;

const participantEvent = (overrides: Record<string, unknown> = {}) => ({
	event: 'participant_connected' as const,
	data: {
		destination_alias: 'sip:12345678@pexip.example',
		source_alias: 'sip:caller@example',
		protocol: 'SIP',
		call_direction: 'in',
		...overrides,
	},
});

/** The endpoint hands the counting off without waiting, so a test has to let the microtask queue drain. */
const settle = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
	jest.clearAllMocks();
	pins.skipForSip = false;
	findOneByProviderNameAndSipAlias.mockResolvedValue(null);
	findOneById.mockResolvedValue(null);
	increaseSipParticipantCount.mockResolvedValue({ _id: 'call1' });
	increaseWebRTCParticipantCount.mockResolvedValue({ _id: 'call1' });
	setStatus.mockResolvedValue(undefined);
	recordProviderParticipant.mockResolvedValue(undefined);
	setProviderParticipantWaiting.mockResolvedValue(undefined);
});

describe('ServerConfigurationEndpoint', () => {
	const endpoint = () => new ServerConfigurationEndpoint(pexip);

	it('should resolve an all-digit alias as a SIP alias', async () => {
		findOneByProviderNameAndSipAlias.mockResolvedValue({ _id: 'call1', title: 'Standup' });

		await endpoint().get({ local_alias: 'sip:12345678@pexip.example' } as never);

		expect(findOneByProviderNameAndSipAlias).toHaveBeenCalledWith('core.pexip', '12345678');
		expect(findOneById).not.toHaveBeenCalled();
	});

	// A conference id is not all digits, so there is no alias to try first.
	it('should resolve anything else as a conference id', async () => {
		findOneById.mockResolvedValue({ _id: 'aBc123', title: 'Standup' });

		await endpoint().get({ local_alias: 'sip:aBc123@pexip.example' } as never);

		expect(findOneByProviderNameAndSipAlias).not.toHaveBeenCalled();
		expect(findOneById).toHaveBeenCalledWith('aBc123');
	});

	// An alias is released when its call ends, so a number that matches nothing may still be an id.
	it('should fall through to the id when no conference holds the alias', async () => {
		findOneById.mockResolvedValue({ _id: '12345678', title: 'Standup' });

		const config = await endpoint().get({ local_alias: '12345678' } as never);

		expect(findOneById).toHaveBeenCalledWith('12345678');
		expect(config).not.toBeNull();
	});

	it('should take a bare alias as readily as a SIP URI', async () => {
		findOneByProviderNameAndSipAlias.mockResolvedValue({ _id: 'call1' });

		await endpoint().get({ local_alias: '12345678' } as never);

		expect(findOneByProviderNameAndSipAlias).toHaveBeenCalledWith('core.pexip', '12345678');
	});

	it('should answer with nothing when the request carries no alias', async () => {
		expect(await endpoint().get({} as never)).toBeNull();
	});

	it('should answer with nothing when the alias names no conference', async () => {
		expect(await endpoint().get({ local_alias: '12345678' } as never)).toBeNull();
	});

	it('should ask SIP participants for the guest pin by default', async () => {
		findOneById.mockResolvedValue({ _id: 'aBc123', title: 'Standup' });

		const config = await endpoint().get({ local_alias: 'aBc123', protocol: 'sip' } as never);

		expect(config).toMatchObject({ pin: '1234', guest_pin: '5678' });
	});

	it('should not ask SIP participants for the guest pin when the workspace skips it', async () => {
		pins.skipForSip = true;
		findOneById.mockResolvedValue({ _id: 'aBc123', title: 'Standup' });

		const config = await endpoint().get({ local_alias: 'aBc123', protocol: 'sip' } as never);

		expect(config).toMatchObject({ pin: '1234' });
		expect(config).not.toHaveProperty('guest_pin');
	});

	it('should still ask other participants for the guest pin when the workspace skips it for SIP', async () => {
		pins.skipForSip = true;
		findOneById.mockResolvedValue({ _id: 'aBc123', title: 'Standup' });

		const config = await endpoint().get({ local_alias: 'aBc123', protocol: 'webrtc' } as never);

		expect(config).toMatchObject({ pin: '1234', guest_pin: '5678' });
	});
});

describe('EventSinkEndpoint', () => {
	const endpoint = () => new EventSinkEndpoint(pexip);

	it('should count a SIP arrival against the alias that was dialled', async () => {
		await endpoint().post(participantEvent() as never);
		await settle();

		expect(increaseSipParticipantCount).toHaveBeenCalledWith('12345678');
		expect(increaseWebRTCParticipantCount).not.toHaveBeenCalled();
	});

	it('should count a WebRTC arrival against the conference', async () => {
		await endpoint().post(participantEvent({ protocol: 'WebRTC', destination_alias: 'sip:call1@pexip.example' }) as never);
		await settle();

		expect(increaseWebRTCParticipantCount).toHaveBeenCalledWith('call1');
		expect(increaseSipParticipantCount).not.toHaveBeenCalled();
	});

	// An outbound leg is the conference dialling somebody, not somebody arriving in it.
	it('should ignore a leg the conference placed itself', async () => {
		await endpoint().post(participantEvent({ call_direction: 'out' }) as never);
		await settle();

		expect(increaseSipParticipantCount).not.toHaveBeenCalled();
	});

	it('should ignore an arrival that names no conference', async () => {
		await endpoint().post(participantEvent({ destination_alias: '' }) as never);
		await settle();

		expect(increaseSipParticipantCount).not.toHaveBeenCalled();
	});

	// Pexip carries transports we have nothing to count; they must not be counted as either of the two.
	it('should ignore a transport it does not count', async () => {
		await endpoint().post(participantEvent({ protocol: 'H323' }) as never);
		await settle();

		expect(increaseSipParticipantCount).not.toHaveBeenCalled();
		expect(increaseWebRTCParticipantCount).not.toHaveBeenCalled();
	});

	// Pexip is waiting on the acknowledgement; counting somebody in must not hold it up or fail it.
	it('should not fail the request when counting throws', async () => {
		increaseSipParticipantCount.mockRejectedValue(new Error('no such conference'));

		await expect(endpoint().post(participantEvent() as never)).resolves.toBeUndefined();
		await settle();
	});

	describe('lobby', () => {
		// A member's own connection: tagged with their user id, to a conference named by its id.
		const memberEvent = (event: string, overrides: Record<string, unknown> = {}) => ({
			...participantEvent({
				protocol: 'WebRTC',
				destination_alias: 'sip:call1@pexip.example',
				call_tag: 'user1',
				uuid: 'p1',
				connect_time: 1795702085,
				...overrides,
			}),
			event,
		});

		beforeEach(() => findOneById.mockResolvedValue({ _id: 'call1' }));

		it('should record a connection that arrives in the lobby as waiting', async () => {
			await endpoint().post(memberEvent('participant_connected', { service_type: 'waiting_room' }) as never);
			await settle();

			expect(recordProviderParticipant).toHaveBeenCalledWith('call1', 'user1', expect.objectContaining({ id: 'p1', waiting: true }));
		});

		it('should record a connection that arrives straight in the call as not waiting', async () => {
			await endpoint().post(memberEvent('participant_connected', { service_type: 'conference' }) as never);
			await settle();

			expect(recordProviderParticipant).toHaveBeenCalledWith('call1', 'user1', expect.not.objectContaining({ waiting: true }));
		});

		it('should stop a connection waiting once Pexip moves it into the conference', async () => {
			await endpoint().post(memberEvent('participant_updated', { service_type: 'conference' }) as never);
			await settle();

			expect(setProviderParticipantWaiting).toHaveBeenCalledWith('call1', 'user1', 'p1', false);
		});

		it('should keep a connection waiting while Pexip still has it in the lobby', async () => {
			await endpoint().post(memberEvent('participant_updated', { service_type: 'waiting_room' }) as never);
			await settle();

			expect(setProviderParticipantWaiting).toHaveBeenCalledWith('call1', 'user1', 'p1', true);
		});

		// Without a call tag there is no member to hold the connection.
		it('should ignore an update about somebody who did not join through Rocket.Chat', async () => {
			await endpoint().post(memberEvent('participant_updated', { service_type: 'conference', call_tag: undefined }) as never);
			await settle();

			expect(setProviderParticipantWaiting).not.toHaveBeenCalled();
		});

		it('should not count anybody in on an update', async () => {
			await endpoint().post(memberEvent('participant_updated', { service_type: 'conference' }) as never);
			await settle();

			expect(increaseWebRTCParticipantCount).not.toHaveBeenCalled();
			expect(recordProviderParticipant).not.toHaveBeenCalled();
		});
	});

	it('should flag a conference as ended', async () => {
		await endpoint().post({ event: 'conference_ended', data: { name: 'call1' } } as never);

		expect(setStatus).toHaveBeenCalledWith('call1', 3);
	});

	it('should swallow an end it cannot apply', async () => {
		setStatus.mockRejectedValue(new Error('invalid-call'));

		await expect(endpoint().post({ event: 'conference_ended', data: { name: '12345678' } } as never)).resolves.toBeUndefined();
	});
});
