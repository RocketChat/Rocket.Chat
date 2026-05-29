import type { IAuditLog, IMessage } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import type { AuditFields } from './useAuditForm';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';

export const useAuditMutation = (type: IAuditLog['fields']['type']) => {
	const getAuditMessages = useEndpoint('POST', '/v1/audit.messages');
	const getOmnichannelAuditMessages = useEndpoint('POST', '/v1/audit.omnichannel.messages');

	return useMutation({
		mutationKey: ['audit'] as const,

		mutationFn: async ({ msg, dateRange, rid, users, visitor, agent }: AuditFields): Promise<IMessage[]> => {
			const startDate = (dateRange.start ?? new Date(0)).toISOString();
			const endDate = (dateRange.end ?? new Date()).toISOString();

			if (type === 'l') {
				const { messages } = await getOmnichannelAuditMessages({
					type,
					msg,
					startDate,
					endDate,
					users,
					visitor: '',
					agent: '',
				});
				return messages.map((message) => mapMessageFromApi(message));
			}

			const { messages } = await getAuditMessages({
				type,
				msg,
				startDate,
				endDate,
				rid,
				users,
				visitor,
				agent,
			});
			return messages.map((message) => mapMessageFromApi(message));
		},
	});
};
