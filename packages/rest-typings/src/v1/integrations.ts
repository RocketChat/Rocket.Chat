import type { IIntegration, IIntegrationHistory } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type IntegrationsEndpoints = {
	'integrations.create': {
		POST: (params: {
			type: string;
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
			targetChannel?: string;
		}) => {
			integration: IIntegration;
		};
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
