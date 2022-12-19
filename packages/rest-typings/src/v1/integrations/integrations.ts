import type { IIntegration, IIntegrationHistory } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import type { PaginatedResult } from '../../helpers/PaginatedResult';
import type { IntegrationsCreateProps } from './IntegrationsCreateProps';
import type { IntegrationsHistoryProps } from './IntegrationsHistoryProps';
import type { IntegrationsRemoveProps } from './IntegrationsRemoveProps';
import type { IntegrationsGetProps } from './IntegrationsGetProps';
import type { IntegrationsUpdateProps } from './IntegrationsUpdateProps';

export type IntegrationsEndpoints = {
	'/v1/integrations.create': {
		POST: (params: IntegrationsCreateProps) => { integration: IIntegration };
	};

	'/v1/integrations.history': {
		GET: (params: IntegrationsHistoryProps) => PaginatedResult<{
			history: IIntegrationHistory[];
			items: number;
		}>;
	};

	'/v1/integrations.list': {
		GET: (params: PaginatedRequest) => PaginatedResult<{
			integrations: IIntegration[];
			items: number;
		}>;
	};

	'/v1/integrations.remove': {
		POST: (params: IntegrationsRemoveProps) => {
			integration: IIntegration;
		};
	};

	'/v1/integrations.get': {
		GET: (params: IntegrationsGetProps) => { integration: IIntegration };
	};

	'/v1/integrations.update': {
		PUT: (params: IntegrationsUpdateProps) => { integration: IIntegration | null };
	};
};
