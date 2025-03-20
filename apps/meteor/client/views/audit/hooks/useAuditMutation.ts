import type { IAuditLog } from '@rocket.chat/core-typings';
import { useMethod } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import type { AuditFields } from './useAuditForm';

export const useAuditMutation = (type: IAuditLog['fields']['type']) => {
	const getAuditMessages = useMethod('auditGetMessages');
	const getOmnichannelAuditMessages = useMethod('auditGetOmnichannelMessages');

	return useMutation({
		mutationKey: ['audit'] as const,

		mutationFn: async ({ msg, dateRange, rid, users, visitor, agent }: AuditFields) => {
			if (type === 'l') {
				return getOmnichannelAuditMessages({
					type,
					msg,
					startDate: dateRange.start ?? new Date(0),
					endDate: dateRange.end ?? new Date(),
					users,
					visitor: '',
					agent: '',
				});
			}

			return getAuditMessages({
				type,
				msg,
				startDate: dateRange.start ?? new Date(0),
				endDate: dateRange.end ?? new Date(),
				rid,
				users,
				visitor,
				agent,
			});
		},
	});
};
