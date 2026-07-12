import { EnterpriseCalendarError } from './errors';
import type {
	CalendarConfigurationValidation,
	CalendarMailboxIdentity,
	CalendarSyncCursor,
	CalendarSyncResult,
	CalendarUserIdentity,
	IEnterpriseCalendarProvider,
	EwsProviderConfiguration,
	NormalizedCalendarEvent,
} from './types';

export const validateEwsConfiguration = (configuration: EwsProviderConfiguration): CalendarConfigurationValidation => {
	let endpoint: URL;
	try {
		endpoint = new URL(configuration.endpoint);
	} catch {
		return { valid: false, code: 'invalid-ews-url', message: 'EWS endpoint is invalid' };
	}
	if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.hash) {
		return { valid: false, code: 'invalid-ews-url', message: 'EWS endpoint must use HTTPS and contain no credentials' };
	}
	if (configuration.authentication.type === 'basic' && configuration.authentication.explicitlyAllowed !== true) {
		return { valid: false, code: 'basic-auth-not-approved', message: 'Basic authentication requires explicit legacy approval' };
	}
	if (!configuration.impersonation) {
		return { valid: false, code: 'impersonation-required', message: 'Scoped Exchange impersonation is required' };
	}
	return { valid: false, code: 'ews-not-implemented', message: 'EWS network synchronization is not available in this release' };
};

export class ExchangeEwsProviderBoundary implements IEnterpriseCalendarProvider {
	readonly type = 'exchange-ews' as const;

	constructor(private readonly configuration: EwsProviderConfiguration) {}

	async validateConfiguration(): Promise<CalendarConfigurationValidation> {
		return validateEwsConfiguration(this.configuration);
	}

	async resolveMailbox(user: CalendarUserIdentity): Promise<CalendarMailboxIdentity | null> {
		if (!user.active || user.providerHint !== this.type) return null;
		const address = user.trustedUpn ?? (user.verifiedEmails.length === 1 ? user.verifiedEmails[0] : undefined);
		return address ? { provider: this.type, address } : null;
	}

	async getCalendarWindow(_mailbox: CalendarMailboxIdentity, _start: Date, _end: Date): Promise<NormalizedCalendarEvent[]> {
		throw this.unsupported();
	}

	async synchronizeChanges(_mailbox: CalendarMailboxIdentity, _cursor: CalendarSyncCursor): Promise<CalendarSyncResult> {
		throw this.unsupported();
	}

	private unsupported(): EnterpriseCalendarError {
		return new EnterpriseCalendarError('unsupported', false, 'Exchange EWS synchronization is not implemented');
	}
}
