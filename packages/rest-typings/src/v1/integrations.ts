import type {
	IIntegration,
	IIntegrationHistory,
	IIncomingIntegration,
	INewIncomingIntegration,
	IUpdateIncomingIntegration,
	IOutgoingIntegration,
	INewOutgoingIntegration,
	IUpdateOutgoingIntegration,
	IUser,
} from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type IntegrationsEndpoints = {
	'integrations.create': {
		POST:
			| ((params: INewIncomingIntegration) => { integration: IIncomingIntegration })
			| ((params: INewOutgoingIntegration) => { integration: IOutgoingIntegration });
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

	'integrations.remove': {
		POST: (
			params: {
				type: IIntegration['type'];
			} & (
				| {
						target_url?: string;
				  }
				| {
						integrationId?: string;
				  }
			),
		) => {
			integration: IIntegration;
		};
	};

	'integrations.get': {
		GET: (params: { integrationId: string; createdBy: IUser['_id'] }) => { integration: IIntegration };
	};

	'integrations.update': {
		PUT:
			| ((
					params: IUpdateIncomingIntegration & {
						type: 'webhook-incoming';
						integrationId: string;
					},
			  ) => { integration: IIncomingIntegration })
			| ((
					params: IUpdateOutgoingIntegration & {
						type: 'webhook-outgoing';
					} & ({ integrationId: string } | { target_url: string }),
			  ) => { integration: IOutgoingIntegration });
	};
};
