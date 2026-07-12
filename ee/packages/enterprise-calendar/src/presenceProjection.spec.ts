import { DEFAULT_PRESENCE_MAPPING, CalendarPresenceProjector, selectEffectiveProjection } from './presenceProjection';
import type { CalendarProjection } from './types';

const now = new Date('2026-07-11T12:00:00Z');
const projection = (availability: CalendarProjection['availability'], end = '2026-07-11T13:00:00Z'): CalendarProjection => ({
	userId: 'u1',
	provider: 'microsoft-graph',
	mailboxHash: 'mailbox',
	eventHash: availability,
	start: new Date('2026-07-11T11:00:00Z'),
	end: new Date(end),
	availability,
	isAllDay: false,
	isPrivate: false,
});

describe('calendar presence projection', () => {
	it('preserves compatibility defaults and ignores tentative/free/all-day events', () => {
		expect(selectEffectiveProjection([projection('tentative'), projection('free')], now)).toBeNull();
		expect(selectEffectiveProjection([{ ...projection('busy'), isAllDay: true }], now)).toBeNull();
	});

	it('chooses deterministic strongest overlapping availability', () => {
		expect(selectEffectiveProjection([projection('busy', '2026-07-11T15:00:00Z'), projection('outOfOffice')], now)).toEqual({
			status: 'busy',
			expiresAt: new Date('2026-07-11T13:00:00Z'),
		});
	});

	it('can map out-of-office to away without changing provider code', () => {
		expect(selectEffectiveProjection([projection('outOfOffice')], now, { ...DEFAULT_PRESENCE_MAPPING, outOfOffice: 'away' })).toMatchObject(
			{
				status: 'away',
			},
		);
	});

	it('recomputes through the owned adapter rather than restoring snapshots', async () => {
		const adapter = { apply: jest.fn().mockResolvedValue(undefined), clear: jest.fn().mockResolvedValue(undefined) };
		const projector = new CalendarPresenceProjector(adapter);
		await projector.recompute('u1', [projection('busy')], now);
		expect(adapter.apply).toHaveBeenCalledWith('u1', 'busy', new Date('2026-07-11T13:00:00Z'));
		await projector.recompute('u1', [], now);
		expect(adapter.clear).toHaveBeenCalledWith('u1');
	});
});
