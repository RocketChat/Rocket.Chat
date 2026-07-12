import type { CalendarAvailability, CalendarProjection, ICalendarPresenceAdapter } from './types';

export type PresenceMapping = Partial<Record<CalendarAvailability, 'busy' | 'away' | 'none'>> & { includeAllDay?: boolean };

const AVAILABILITY_STRENGTH: Record<CalendarAvailability, number> = {
	free: 0,
	unknown: 0,
	workingElsewhere: 1,
	tentative: 2,
	busy: 3,
	outOfOffice: 4,
};

export const DEFAULT_PRESENCE_MAPPING: PresenceMapping = {
	free: 'none',
	unknown: 'none',
	workingElsewhere: 'none',
	tentative: 'none',
	busy: 'busy',
	outOfOffice: 'busy',
	includeAllDay: false,
};

export const selectEffectiveProjection = (
	projections: CalendarProjection[],
	at: Date,
	mapping: PresenceMapping = DEFAULT_PRESENCE_MAPPING,
): { status: 'busy' | 'away'; expiresAt: Date } | null => {
	const eligible = projections
		.filter((event) => event.start <= at && event.end > at && (mapping.includeAllDay || !event.isAllDay))
		.filter((event) => (mapping[event.availability] ?? DEFAULT_PRESENCE_MAPPING[event.availability]) !== 'none')
		.sort((a, b) => AVAILABILITY_STRENGTH[b.availability] - AVAILABILITY_STRENGTH[a.availability] || b.end.getTime() - a.end.getTime());
	if (!eligible.length) return null;
	const strongest = eligible[0];
	const status = mapping[strongest.availability] ?? DEFAULT_PRESENCE_MAPPING[strongest.availability];
	if (!status || status === 'none') return null;
	const sameOrStronger = eligible.filter(
		(event) => AVAILABILITY_STRENGTH[event.availability] >= AVAILABILITY_STRENGTH[strongest.availability],
	);
	const expiresAt = sameOrStronger.reduce((latest, event) => (event.end > latest ? event.end : latest), strongest.end);
	return { status, expiresAt };
};

export class CalendarPresenceProjector {
	constructor(
		private readonly adapter: ICalendarPresenceAdapter,
		private readonly mapping: PresenceMapping = DEFAULT_PRESENCE_MAPPING,
	) {}

	async recompute(userId: string, projections: CalendarProjection[], at = new Date()): Promise<void> {
		const effective = selectEffectiveProjection(projections, at, this.mapping);
		if (!effective) return this.adapter.clear(userId);
		return this.adapter.apply(userId, effective.status, effective.expiresAt);
	}
}
