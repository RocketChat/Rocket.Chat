export type CalendarErrorCategory =
	| 'authentication'
	| 'authorization'
	| 'mailbox-not-found'
	| 'invalid-cursor'
	| 'throttled'
	| 'timeout'
	| 'service-unavailable'
	| 'invalid-response'
	| 'configuration'
	| 'unsupported';

export class EnterpriseCalendarError extends Error {
	constructor(
		public readonly category: CalendarErrorCategory,
		public readonly retryable: boolean,
		message: string,
		public readonly retryAfterMs?: number,
	) {
		super(message);
		this.name = 'EnterpriseCalendarError';
	}
}

export const sanitizeGraphError = (status: number, code?: string, retryAfterMs?: number): EnterpriseCalendarError => {
	if (status === 401) return new EnterpriseCalendarError('authentication', false, 'Microsoft credential is invalid or expired');
	if (status === 403) return new EnterpriseCalendarError('authorization', false, 'Calendar permission or mailbox scope denied');
	if (status === 404)
		return new EnterpriseCalendarError('mailbox-not-found', false, 'Mailbox was not found or is outside application scope');
	if (status === 410 || code === 'ErrorInvalidSyncStateData') {
		return new EnterpriseCalendarError('invalid-cursor', false, 'Calendar synchronization cursor is no longer valid');
	}
	if (status === 429) return new EnterpriseCalendarError('throttled', true, 'Microsoft Graph throttled the request', retryAfterMs);
	if (status >= 500)
		return new EnterpriseCalendarError('service-unavailable', true, 'Microsoft Graph is temporarily unavailable', retryAfterMs);
	return new EnterpriseCalendarError('invalid-response', false, 'Microsoft Graph rejected the calendar request');
};
