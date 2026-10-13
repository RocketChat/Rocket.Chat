import type { IMediaCall } from '@rocket.chat/core-typings';

import { UserActorSignalProcessor } from './CallSignalProcessor';
import { TAKE_OVER_NEGOTIATION_POLL_INTERVAL, TAKE_OVER_NEGOTIATION_TIMEOUT } from '../../constants';
import type { IMediaCallAgent } from '../../definition/IMediaCallAgent';

const mockHasUnfinishedCallsByUid = jest.fn();
const mockReplaceActorContract = jest.fn();
const mockStartNewNegotiation = jest.fn();
const mockFindLatestNegotiation = jest.fn();
const mockFindCallById = jest.fn();
const mockHangupByServer = jest.fn();
const mockSendSignal = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	MediaCalls: {
		hasUnfinishedCallsByUid: (...args: unknown[]) => mockHasUnfinishedCallsByUid(...args),
		findOneById: (...args: unknown[]) => mockFindCallById(...args),
	},
	MediaCallNegotiations: { findLatestByCallId: (...args: unknown[]) => mockFindLatestNegotiation(...args) },
}));

jest.mock('../../server/CallDirector', () => ({
	mediaCallDirector: {
		replaceActorContract: (...args: unknown[]) => mockReplaceActorContract(...args),
		startNewNegotiation: (...args: unknown[]) => mockStartNewNegotiation(...args),
		hangupByServer: (...args: unknown[]) => mockHangupByServer(...args),
	},
}));

jest.mock('../../server/injection', () => ({
	getMediaCallServer: () => ({ sendSignal: (...args: unknown[]) => mockSendSignal(...args) }),
}));

const createCall = (overrides: Partial<IMediaCall> = {}): IMediaCall =>
	({
		_id: 'call-id',
		state: 'active',
		service: 'webrtc',
		features: ['audio', 'hold'],
		caller: { type: 'user', id: 'user-id', contractId: 'old-contract' },
		callee: { type: 'sip', id: 'other' },
		...overrides,
	}) as unknown as IMediaCall;

const createAgent = () => {
	const oppositeAgent = { onCallUpdated: jest.fn().mockResolvedValue(undefined) };
	const agent = { actorId: 'user-id', actorType: 'user', role: 'caller', oppositeAgent } as unknown as IMediaCallAgent;
	return { agent, oppositeAgent };
};

describe('UserActorSignalProcessor take-over', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		mockHasUnfinishedCallsByUid.mockResolvedValue(false);
		mockStartNewNegotiation.mockResolvedValue('negotiation-id');
		mockFindLatestNegotiation.mockResolvedValue(null);
		mockReplaceActorContract.mockImplementation(async (call: IMediaCall) => call);
	});

	const takeOver = (call: IMediaCall, agent: IMediaCallAgent, features = ['audio', 'hold'] as const) =>
		new UserActorSignalProcessor(agent, call, 'new-contract').processSignal({
			type: 'take-over',
			callId: call._id,
			contractId: 'new-contract',
			supportedFeatures: [...features],
		});

	it('moves the call to the new session and asks it for an offer', async () => {
		const { agent } = createAgent();
		await takeOver(createCall(), agent);

		expect(mockReplaceActorContract).toHaveBeenCalledWith(expect.anything(), 'caller', {
			oldContractId: 'old-contract',
			newContractId: 'new-contract',
			supportedFeatures: ['audio', 'hold'],
		});
		expect(mockSendSignal).toHaveBeenNthCalledWith(
			1,
			'user-id',
			expect.objectContaining({ type: 'notification', notification: 'session-changed', signedContractId: 'new-contract' }),
		);
		expect(mockStartNewNegotiation).toHaveBeenCalledWith(expect.anything(), 'caller');
		expect(mockSendSignal).toHaveBeenNthCalledWith(2, 'user-id', {
			callId: 'call-id',
			toContractId: 'new-contract',
			type: 'request-offer',
			negotiationId: 'negotiation-id',
		});
	});

	it('tells the other side when the new session supports fewer features', async () => {
		const { agent, oppositeAgent } = createAgent();
		mockReplaceActorContract.mockImplementation(async (call: IMediaCall) => ({ ...call, features: ['audio'] }));

		await takeOver(createCall(), agent, ['audio']);

		expect(oppositeAgent.onCallUpdated).toHaveBeenCalledWith('call-id');
	});

	it.each([
		['the session already owns the call', { caller: { type: 'user', id: 'user-id', contractId: 'new-contract' } }],
		['the call has no contract yet', { caller: { type: 'user', id: 'user-id' } }],
		['the call is not active', { state: 'accepted' }],
		['the call is not a webrtc call', { service: 'cti' }],
	] as const)('is ignored when %s', async (_, overrides) => {
		const { agent } = createAgent();
		await takeOver(createCall(overrides as Partial<IMediaCall>), agent);

		expect(mockReplaceActorContract).not.toHaveBeenCalled();
		expect(mockSendSignal).not.toHaveBeenCalled();
	});

	it('is ignored when the user has another unfinished call', async () => {
		const { agent } = createAgent();
		mockHasUnfinishedCallsByUid.mockResolvedValue(true);

		await takeOver(createCall(), agent);

		expect(mockHasUnfinishedCallsByUid).toHaveBeenCalledWith('user-id', 'call-id');
		expect(mockReplaceActorContract).not.toHaveBeenCalled();
	});

	it('does nothing when another session got the call first', async () => {
		const { agent } = createAgent();
		mockReplaceActorContract.mockResolvedValue(null);

		await takeOver(createCall(), agent);

		expect(mockSendSignal).not.toHaveBeenCalled();
		expect(mockStartNewNegotiation).not.toHaveBeenCalled();
	});

	describe('while the caller has an offer waiting for its answer', () => {
		const pendingOffer = { offerer: 'caller', offer: { type: 'offer', sdp: 'sdp' } };

		beforeEach(() => jest.useFakeTimers());
		afterEach(() => jest.useRealTimers());

		it('waits for the answer before moving the call', async () => {
			const { agent } = createAgent();
			mockFindLatestNegotiation
				.mockResolvedValueOnce(pendingOffer)
				.mockResolvedValueOnce(pendingOffer)
				.mockResolvedValue({
					...pendingOffer,
					answer: { type: 'answer', sdp: 'sdp' },
				});

			const result = takeOver(createCall(), agent);
			await jest.advanceTimersByTimeAsync(0);
			expect(mockReplaceActorContract).not.toHaveBeenCalled();

			await jest.advanceTimersByTimeAsync(500);
			await result;

			expect(mockReplaceActorContract).toHaveBeenCalledTimes(1);
			expect(mockHangupByServer).not.toHaveBeenCalled();
		});

		it('ends the call if the offer is never answered', async () => {
			const { agent } = createAgent();
			mockFindLatestNegotiation.mockResolvedValue(pendingOffer);
			mockFindCallById.mockResolvedValue(createCall());

			const result = takeOver(createCall(), agent);
			await jest.advanceTimersByTimeAsync(TAKE_OVER_NEGOTIATION_TIMEOUT + TAKE_OVER_NEGOTIATION_POLL_INTERVAL);
			await result;

			expect(mockHangupByServer).toHaveBeenCalledWith(expect.anything(), 'take-over-negotiation-timeout');
			expect(mockReplaceActorContract).not.toHaveBeenCalled();
		});

		it.each([
			['ended', { ended: true }],
			['moved to another session', { caller: { type: 'user', id: 'user-id', contractId: 'third-contract' } }],
		] as const)('leaves the call alone if it %s while waiting', async (_, overrides) => {
			const { agent } = createAgent();
			mockFindLatestNegotiation.mockResolvedValue(pendingOffer);
			mockFindCallById.mockResolvedValue(createCall(overrides as Partial<IMediaCall>));

			const result = takeOver(createCall(), agent);
			await jest.advanceTimersByTimeAsync(TAKE_OVER_NEGOTIATION_TIMEOUT + TAKE_OVER_NEGOTIATION_POLL_INTERVAL);
			await result;

			expect(mockHangupByServer).not.toHaveBeenCalled();
		});

		it('does not wait for an offer from the callee', async () => {
			const { agent } = createAgent();
			mockFindLatestNegotiation.mockResolvedValue({ offerer: 'callee', offer: { type: 'offer', sdp: 'sdp' } });

			await takeOver(createCall(), agent);

			expect(mockReplaceActorContract).toHaveBeenCalledTimes(1);
		});
	});
});
