import type { IIntegration, IIntegrationHistory, IIncomingIntegration, IOutgoingIntegration } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type IntegrationsEndpoints = {
	'integrations.create': {
		POST:
			| ((params: {
					type: IIncomingIntegration['type'];
					name: string;
					enabled: boolean;
					username: string;
					channel: string;
					alias?: string;
					avatarUrl?: string;
					emoji?: string;
					scriptEnabled: boolean;
					script?: string;
			  }) => {
					integration: IIncomingIntegration;
			  })
			| ((params: {
					type: IOutgoingIntegration['type'];
					name: string;
					enabled: boolean;
					username: string;
					urls?: string[];
					channel: string;
					event?: string;
					triggerWords?: string[];
					alias?: string;
					avatar?: string;
					emoji?: string;
					token?: string;
					scriptEnabled: boolean;
					script?: string;
					targetRoom?: string;
					impersonateUser?: boolean;
					retryCount?: number;
					retryDelay?: string;
					retryFailedCalls?: boolean;
					runOnEdits?: boolean;
					triggerWordAnywhere?: boolean;
			  }) => {
					integration: IOutgoingIntegration;
			  });
	};

	'integrations.history': {
		GET: (
			params: PaginatedRequest<{
				id: string;
			}>,
		) => PaginatedResult<{
			history: IIntegrationHistory[];
		}>;
	};

	'integrations.list': {
		GET: (params: PaginatedRequest<{}>) => PaginatedResult<{
			integrations: IIntegration[];
		}>;
	};
};
