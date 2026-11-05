import type { IIntegration, IIntegrationHistory } from '@rocket.chat/core-typings';

import type { IntegrationsClearHistoryProps } from './IntegrationsClearHistoryProps.js';
import type { IntegrationsCreateProps } from './IntegrationsCreateProps.js';
import type { IntegrationsGetProps } from './IntegrationsGetProps.js';
import type { IntegrationsHistoryProps } from './IntegrationsHistoryProps.js';
import type { IntegrationsListProps } from './IntegrationsListProps.js';
import type { IntegrationsRemoveProps } from './IntegrationsRemoveProps.js';
import type { IntegrationsReplayProps } from './IntegrationsReplayProps.js';
import type { IntegrationsUpdateProps } from './IntegrationsUpdateProps.js';
import type { PaginatedResult } from '../../helpers/PaginatedResult.js';

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
		GET: (params: IntegrationsListProps) => PaginatedResult<{
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

	'/v1/integrations.clearHistory': {
		POST: (params: IntegrationsClearHistoryProps) => void;
	};

	'/v1/integrations.replayOutgoing': {
		POST: (params: IntegrationsReplayProps) => void;
	};
};
