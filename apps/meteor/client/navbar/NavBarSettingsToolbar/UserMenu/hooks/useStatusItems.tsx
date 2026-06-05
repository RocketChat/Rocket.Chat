import type { ICustomUserStatus, IUser } from '@rocket.chat/core-typings';
import { UserStatus as UserStatusEnum } from '@rocket.chat/core-typings';
import { Box, Icon, RadioButton } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { clientCallbacks } from '@rocket.chat/ui-client';
import { useEndpoint, useSetting, useStream } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useCustomStatusModalHandler } from './useCustomStatusModalHandler';
import MarkdownText from '../../../../components/MarkdownText';
import { UserStatus } from '../../../../components/UserStatus';
import { useExpirationText } from '../../../../hooks/useExpirationText';
import { useFireGlobalEvent } from '../../../../hooks/useFireGlobalEvent';
import { userStatuses } from '../../../../lib/userStatuses';
import type { UserStatusDescriptor } from '../../../../lib/userStatuses';
import { mapCustomUserStatusFromApi } from '../../../../lib/utils/mapCustomUserStatusFromApi';
import { useStatusDisabledModal } from '../../../../views/admin/customUserStatus/hooks/useStatusDisabledModal';

export const useStatusItems = (user?: IUser): GenericMenuItemProps[] => {
	// We should lift this up to somewhere else if we want to use it in other places

	userStatuses.invisibleAllowed = useSetting('Accounts_AllowInvisibleStatusOption', true);

	const queryClient = useQueryClient();
	const stream = useStream('notify-logged');
	const listCustomUserStatusEndpoint = useEndpoint('GET', '/v1/custom-user-status.list');
	const listCustomUserStatus = useCallback(async (): Promise<ICustomUserStatus[]> => {
		const all: ICustomUserStatus[] = [];
		const count = 100;
		let offset = 0;
		// REST endpoint is paginated; loop until total reached.
		while (true) {
			const { statuses, total } = await listCustomUserStatusEndpoint({ count, offset });
			all.push(...statuses.map(mapCustomUserStatusFromApi));
			if (all.length >= total || statuses.length === 0) break;
			offset += statuses.length;
		}
		return all;
	}, [listCustomUserStatusEndpoint]);

	useEffect(
		() =>
			userStatuses.watch(stream, () => {
				queryClient.setQueryData(['user-statuses'], Array.from(userStatuses));
			}),
		[queryClient, stream],
	);

	const { t } = useTranslation();

	const fireGlobalStatusEvent = useFireGlobalEvent('user-status-manually-set');
	const setStatus = useEndpoint('POST', '/v1/users.setStatus');
	const setStatusMutation = useMutation({
		mutationFn: async (status: UserStatusDescriptor) => {
			void setStatus({ status: status.statusType, message: userStatuses.isValidType(status.id) ? '' : status.name });
			void clientCallbacks.run('userStatusManuallySet', status);
			await fireGlobalStatusEvent.mutateAsync(status);
		},
	});

	const presenceDisabled = useSetting('Presence_broadcast_disabled', false);
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange', true);

	const { data: statuses } = useQuery({
		queryKey: ['user-statuses'],
		queryFn: async () => {
			await userStatuses.sync(listCustomUserStatus);
			return Array.from(userStatuses);
		},
		staleTime: Infinity,
	});

	const handleStatusDisabledModal = useStatusDisabledModal();
	const handleCustomStatus = useCustomStatusModalHandler();
	const customStatusExpiration = useExpirationText(user?.statusExpiresAt);

	if (presenceDisabled || !allowUserStatusMessageChange) {
		return [
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
		];
	}

	const items: GenericMenuItemProps[] = [];

	// Top: user's currently-active custom status (display only — clicking does nothing, already selected).
	if (user?.statusText) {
		items.push({
			id: 'current-custom-status',
			status: <UserStatus status={user.status} />,
			content: (
				<Box display='flex' flexDirection='column' rowGap={4}>
					<MarkdownText content={user.statusText} parseEmoji variant='inline' />
					{customStatusExpiration && (
						<Box color='secondary-info' display='flex' alignItems='center'>
							<Icon name='clock' size='x16' mie={4} />
							{customStatusExpiration}
						</Box>
					)}
				</Box>
			),
			addon: <RadioButton checked readOnly />,
		});
	}

	// Always: "Custom Status" action - opens the edit modal.
	items.push({
		id: 'custom-status-edit',
		icon: 'edit',
		content: t('Custom_Status'),
		onClick: handleCustomStatus,
	});

	// Presets: filter to Online / Busy / Offline. Keep Away only if user is currently on Away (legacy).
	const isPresetSelected = (statusType: UserStatusEnum): boolean => !user?.statusText && user?.status === statusType;
	const presetItems = (statuses ?? [])
		.filter((s) => userStatuses.isValidType(s.id))
		.filter((s) => s.statusType !== UserStatusEnum.AWAY || isPresetSelected(UserStatusEnum.AWAY))
		.map(
			(status): GenericMenuItemProps => ({
				id: status.id,
				status: <UserStatus status={status.statusType} />,
				content: <MarkdownText content={status.localizeName ? t(status.name) : status.name} parseEmoji variant='inline' />,
				addon: <RadioButton checked={isPresetSelected(status.statusType)} readOnly />,
				onClick: () => setStatusMutation.mutate(status),
			}),
		);

	return [...items, ...presetItems];
};
