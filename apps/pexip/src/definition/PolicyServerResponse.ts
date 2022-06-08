import type { HttpStatusCode } from '@rocket.chat/apps-engine/definition/accessors';
import type { ServiceConfiguration } from './ServiceConfiguration';

export type PolicyServerResponse = {
	// Should be either OK or an Error code. Redirects won't be followed.
	status: HttpStatusCode;
	content: {
		status: 'success' | 'failure';
		action?: 'reject' | 'continue';
		result: ServiceConfiguration;
	};
}
