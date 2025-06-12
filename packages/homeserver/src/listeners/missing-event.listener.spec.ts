import { test, expect, describe, mock, beforeEach, type Mock } from 'bun:test';
import { MissingEventListener } from './missing-event.listener';
import { MissingEventsQueue } from '../queues/missing-event.queue';
import { StagingAreaService } from '../services/staging-area.service';
import { EventService } from '../services/event.service';
import { EventFetcherService } from '../services/event-fetcher.service';
import type { EventBase } from '../models/event.model';

function createMockEvent(
	eventId: string,
	roomId: string,
	origin: string,
): EventBase {
	return {
		event_id: eventId,
		room_id: roomId,
		type: 'test.event',
		sender: 'user@test.com',
		content: {},
		origin_server_ts: Date.now(),
		origin,
		depth: 1,
		prev_events: ['prev1'],
		auth_events: ['auth1'],
	} as EventBase;
}

describe('MissingEventListener', () => {
	let mockMissingEventsQueue: {
		registerHandler: Mock<(fn: unknown) => unknown>;
		enqueue: Mock<() => Promise<void>>;
	};
	let mockStagingAreaService: Record<string, Mock<() => unknown>>;
	let mockEventService: Record<string, Mock<() => unknown>>;
	let mockEventFetcherService: Record<string, Mock<() => unknown>>;
	let listener: MissingEventListener;

	beforeEach(() => {
		mockMissingEventsQueue = {
			registerHandler: mock((fn: unknown) => fn),
			enqueue: mock(() => Promise.resolve()),
		};

		mockStagingAreaService = {
			addEventToQueue: mock(() => Promise.resolve()),
		};

		mockEventService = {
			checkIfEventExistsIncludingStaged: mock(() => Promise.resolve(false)),
			checkIfEventsExists: mock(() =>
				Promise.resolve({ missing: [], found: [] }),
			),
			storeEventAsStaged: mock(() => Promise.resolve()),
			removeDependencyFromStagedEvents: mock(() => Promise.resolve(0)),
			findStagedEvents: mock(() => Promise.resolve([])),
			markEventAsUnstaged: mock(() => Promise.resolve()),
		};

		mockEventFetcherService = {
			fetchEventsByIds: mock(() =>
				Promise.resolve({ events: [], missingEventIds: [] }),
			),
		};

		listener = new MissingEventListener(
			mockMissingEventsQueue as unknown as MissingEventsQueue,
			mockStagingAreaService as unknown as StagingAreaService,
			mockEventService as unknown as EventService,
			mockEventFetcherService as unknown as EventFetcherService,
		);
	});

	test('handleQueueItem should exit early if event already exists', async () => {
		mockEventService.checkIfEventExistsIncludingStaged.mockReturnValue(
			Promise.resolve(true),
		);

		await listener.handleQueueItem({
			eventId: 'existing-event-id',
			roomId: 'room-id',
			origin: 'origin.com',
		});

		expect(
			mockEventService.checkIfEventExistsIncludingStaged,
		).toHaveBeenCalledWith('existing-event-id');
		expect(
			mockEventService.removeDependencyFromStagedEvents,
		).toHaveBeenCalledWith('existing-event-id');
		expect(mockEventFetcherService.fetchEventsByIds).not.toHaveBeenCalled();
	});

	test('handleQueueItem should process fetched events with no missing dependencies', async () => {
		const eventId = 'event-id';
		const roomId = 'room-id';
		const origin = 'origin.com';

		const mockEvent = createMockEvent(eventId, roomId, origin);

		mockEventService.checkIfEventExistsIncludingStaged.mockReturnValue(
			Promise.resolve(false),
		);
		mockEventFetcherService.fetchEventsByIds.mockReturnValue(
			Promise.resolve({
				events: [{ eventId, event: mockEvent }],
				missingEventIds: [],
			}),
		);
		mockEventService.checkIfEventsExists.mockReturnValue(
			Promise.resolve({
				missing: [],
				found: ['auth1', 'prev1'],
			}),
		);
		mockEventService.findStagedEvents.mockReturnValue(
			Promise.resolve([
				{
					_id: eventId,
					event: mockEvent,
					origin,
					missing_dependencies: [],
					staged_at: Date.now(),
				},
			]),
		);

		await listener.handleQueueItem({ eventId, roomId, origin });

		expect(
			mockEventService.checkIfEventExistsIncludingStaged,
		).toHaveBeenCalledWith(eventId);
		expect(mockEventFetcherService.fetchEventsByIds).toHaveBeenCalledWith(
			[eventId],
			roomId,
			origin,
		);
		expect(mockEventService.checkIfEventsExists).toHaveBeenCalledWith([
			'auth1',
			'prev1',
		]);
		expect(mockEventService.storeEventAsStaged).toHaveBeenCalledWith(
			expect.objectContaining({
				_id: eventId,
				event: mockEvent,
				origin,
				missing_dependencies: [],
			}),
		);
		expect(
			mockEventService.removeDependencyFromStagedEvents,
		).toHaveBeenCalledWith(eventId);
		expect(mockEventService.findStagedEvents).toHaveBeenCalled();
	});

	test('handleQueueItem should process fetched events with missing dependencies', async () => {
		const eventId = 'event-id';
		const roomId = 'room-id';
		const origin = 'origin.com';

		const mockEvent = createMockEvent(eventId, roomId, origin);
		mockEvent.auth_events = ['auth1', 'auth2'];

		mockEventService.checkIfEventExistsIncludingStaged.mockReturnValue(
			Promise.resolve(false),
		);
		mockEventFetcherService.fetchEventsByIds.mockReturnValue(
			Promise.resolve({
				events: [{ eventId, event: mockEvent }],
				missingEventIds: [],
			}),
		);
		mockEventService.checkIfEventsExists.mockReturnValue(
			Promise.resolve({
				missing: ['auth2'],
				found: ['auth1', 'prev1'],
			}),
		);

		await listener.handleQueueItem({ eventId, roomId, origin });

		expect(
			mockEventService.checkIfEventExistsIncludingStaged,
		).toHaveBeenCalledWith(eventId);
		expect(mockEventFetcherService.fetchEventsByIds).toHaveBeenCalledWith(
			[eventId],
			roomId,
			origin,
		);
		expect(mockEventService.checkIfEventsExists).toHaveBeenCalledWith([
			'auth1',
			'auth2',
			'prev1',
		]);
		expect(mockEventService.storeEventAsStaged).toHaveBeenCalledWith(
			expect.objectContaining({
				_id: eventId,
				event: mockEvent,
				origin,
				missing_dependencies: ['auth2'],
			}),
		);
		expect(mockMissingEventsQueue.enqueue).toHaveBeenCalledWith({
			eventId: 'auth2',
			roomId,
			origin,
		});
		expect(
			mockEventService.removeDependencyFromStagedEvents,
		).toHaveBeenCalledWith(eventId);
	});

	test('processStagedEvents should process events with no missing dependencies', async () => {
		const eventId = 'event-id';
		const roomId = 'room-id';
		const origin = 'origin.com';

		const mockEvent = createMockEvent(eventId, roomId, origin);

		mockEventService.findStagedEvents.mockReturnValue(
			Promise.resolve([
				{
					_id: eventId,
					event: mockEvent,
					origin,
					missing_dependencies: [],
					staged_at: Date.now(),
				},
			]),
		);

		// @ts-ignore
		await listener.processStagedEvents();

		expect(mockEventService.findStagedEvents).toHaveBeenCalled();
		expect(mockStagingAreaService.addEventToQueue).toHaveBeenCalledWith({
			eventId,
			roomId,
			origin,
			event: mockEvent,
		});
		expect(mockEventService.markEventAsUnstaged).toHaveBeenCalledWith(eventId);
	});

	test('processStagedEvents should skip events with missing dependencies', async () => {
		const eventId = 'event-id';
		const roomId = 'room-id';
		const origin = 'origin.com';

		const mockEvent = createMockEvent(eventId, roomId, origin);

		mockEventService.findStagedEvents.mockReturnValue(
			Promise.resolve([
				{
					_id: eventId,
					event: mockEvent,
					origin,
					missing_dependencies: ['missing1'],
					staged_at: Date.now(),
				},
			]),
		);

		// @ts-ignore
		await listener.processStagedEvents();

		expect(mockEventService.findStagedEvents).toHaveBeenCalled();
		expect(mockStagingAreaService.addEventToQueue).not.toHaveBeenCalled();
		expect(mockEventService.markEventAsUnstaged).not.toHaveBeenCalled();
	});

	test('extractDependencies should return unique merged auth_events and prev_events', () => {
		const event: EventBase = {
			auth_events: ['auth1', 'auth2', 'common'],
			prev_events: ['prev1', 'common'],
			type: 'test.event',
			room_id: 'room-id',
			sender: 'user@test.com',
			origin_server_ts: Date.now(),
			origin: 'origin.com',
			depth: 1,
		} as EventBase;

		// @ts-ignore
		const result = listener.extractDependencies(event);

		expect(result).toContain('auth1');
		expect(result).toContain('auth2');
		expect(result).toContain('common');
		expect(result).toContain('prev1');
		expect(result.length).toBe(4);
	});

	test('extractDependencies should handle empty arrays', () => {
		const event: EventBase = {
			auth_events: [],
			prev_events: [],
			type: 'test.event',
			room_id: 'room-id',
			sender: 'user@test.com',
			origin_server_ts: Date.now(),
			origin: 'origin.com',
			depth: 1,
		} as EventBase;

		// @ts-ignore
		const result = listener.extractDependencies(event);

		expect(result).toEqual([]);
	});

	test('extractDependencies should handle missing arrays', () => {
		const event = {} as EventBase;

		// @ts-ignore
		const result = listener.extractDependencies(event);

		expect(result).toEqual([]);
	});

	test('updateStagedEventDependencies should handle errors', async () => {
		const error = new Error('Mock error');
		mockEventService.removeDependencyFromStagedEvents.mockImplementation(() => {
			throw error;
		});

		// @ts-ignore
		await listener.updateStagedEventDependencies('event-id');
	});

	test('processAndStoreStagedEvent should handle errors', async () => {
		const eventId = 'event-id';
		const roomId = 'room-id';
		const origin = 'origin.com';

		const mockEvent = createMockEvent(eventId, roomId, origin);

		const error = new Error('Mock error');
		mockStagingAreaService.addEventToQueue.mockImplementation(() => {
			throw error;
		});

		// @ts-ignore
		await listener.processAndStoreStagedEvent({
			_id: eventId,
			event: mockEvent,
			origin,
			missing_dependencies: [],
			staged_at: Date.now(),
		});

		expect(mockEventService.markEventAsUnstaged).not.toHaveBeenCalled();
	});

	test('handleQueueItem should handle errors during fetch', async () => {
		mockEventService.checkIfEventExistsIncludingStaged.mockReturnValue(
			Promise.resolve(false),
		);
		mockEventFetcherService.fetchEventsByIds.mockImplementation(() => {
			throw new Error('Fetch error');
		});

		await listener.handleQueueItem({
			eventId: 'event-id',
			roomId: 'room-id',
			origin: 'origin.com',
		});

		expect(
			mockEventService.checkIfEventExistsIncludingStaged,
		).toHaveBeenCalled();
		expect(mockEventFetcherService.fetchEventsByIds).toHaveBeenCalled();
		expect(mockEventService.storeEventAsStaged).not.toHaveBeenCalled();
	});
});
