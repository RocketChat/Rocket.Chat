import { Box } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useCustomStatusModalHandler } from './useCustomStatusModalHandler';
import { callbacks } from '../../../../../lib/callbacks';
import MarkdownText from '../../../../components/MarkdownText';
import { UserStatus } from '../../../../components/UserStatus';
import { useFireGlobalEvent } from '../../../../hooks/useFireGlobalEvent';
import { userStatuses } from '../../../../lib/userStatuses';
import type { UserStatusDescriptor } from '../../../../lib/userStatuses';
import { useStatusDisabledModal } from '../../../../views/admin/customUserStatus/hooks/useStatusDisabledModal';

export const useStatusItems = (): GenericMenuItemProps[] => {
	// We should lift this up to somewhere else if we want to use it in other places

	userStatuses.invisibleAllowed = useSetting('Accounts_AllowInvisibleStatusOption', true);

	const queryClient = useQueryClient();

	useEffect(
		() =>
			userStatuses.watch(() => {
				queryClient.setQueryData(['user-statuses'], Array.from(userStatuses));
			}),
		[queryClient],
	);

	const { t } = useTranslation();

	const fireGlobalStatusEvent = useFireGlobalEvent('user-status-manually-set');
	const setStatus = useEndpoint('POST', '/v1/users.setStatus');
	const setStatusMutation = useMutation({
		mutationFn: async (status: UserStatusDescriptor) => {
			void setStatus({ status: status.statusType, message: userStatuses.isValidType(status.id) ? '' : status.name });
			void callbacks.run('userStatusManuallySet', status);
			await fireGlobalStatusEvent.mutateAsync(status);
		},
	});

	const presenceDisabled = useSetting('Presence_broadcast_disabled', false);

	const { data: statuses } = useQuery({
		queryKey: ['user-statuses'],
		queryFn: async () => {
			await userStatuses.sync();
			return Array.from(userStatuses);
		},
		staleTime: Infinity,
		select: (statuses) =>
			statuses.map((status): GenericMenuItemProps => {
				const content = status.localizeName ? t(status.name) : status.name;
				return {
					id: status.id,
					status: <UserStatus status={status.statusType} />,
					content: <MarkdownText content={content} parseEmoji={true} variant='inline' />,
					disabled: presenceDisabled,
					onClick: () => setStatusMutation.mutate(status),
				};
			}),
	});

	const handleStatusDisabledModal = useStatusDisabledModal();
	const handleCustomStatus = useCustomStatusModalHandler();

	return [
		...(presenceDisabled
			? [
					{
						id: 'presence-disabled',
						content: (
							<Box fontScale='p2'>
								<Box mbe={4} wordBreak='break-word' style={{ whiteSpace: 'normal' }}>
									{t('User_status_disabled')}
								</Box>
								<Box is='a' color='info' onClick={handleStatusDisabledModal}>
									{t('Learn_more')}
								</Box>
							</Box>
						),
					},
				]
			: []),
		...(statuses ?? []),
		{ id: 'custom-status', icon: 'emoji', content: t('Custom_Status'), onClick: handleCustomStatus, disabled: presenceDisabled },
	];
};
