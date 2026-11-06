import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus as UserStatusEnum } from '@rocket.chat/core-typings';
import { Box, Icon, RadioButton } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useCustomStatusModalHandler } from './useCustomStatusModalHandler';
import { useStatusVisibilityModalHandler } from './useStatusVisibilityModalHandler';
import MarkdownText from '../../../../components/MarkdownText';
import { UserStatus } from '../../../../components/UserStatus';
import UserStatusDisabledInfo from '../../../../components/UserStatusDisabledInfo';
import { useExpirationText } from '../../../../hooks/useExpirationText';
import { useSetUserStatus } from '../../../../hooks/useSetUserStatus';
import { useUserStatuses } from '../../../../hooks/useUserStatuses';
import { userStatuses } from '../../../../lib/userStatuses';
import { useStatusDisabledModal } from '../../../../views/admin/customUserStatus/hooks/useStatusDisabledModal';

export const useStatusItems = (user?: IUser): GenericMenuItemProps[] => {
	const invisibleAllowed = useSetting('Accounts_AllowInvisibleStatusOption', true);

	const { t } = useTranslation();

	const presenceDisabled = useSetting('Presence_broadcast_disabled', false);
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange', true);

	const setStatusMutation = useSetUserStatus();

	const statuses = useUserStatuses();

	const workspacePresenceDisabled = useSetting('Accounts_UserStatus_Enabled', true) === false;
	const adminStatusHidingEnabled = useSetting('Accounts_StatusVisibility_Admin_Enabled', false);
	const userPresenceDisabled = user?.presenceDisabledByAdmin === true && adminStatusHidingEnabled;
	const handleStatusDisabledModal = useStatusDisabledModal();
	const handleCustomStatus = useCustomStatusModalHandler();
	const handleStatusVisibility = useStatusVisibilityModalHandler();
	const statusVisibilityEnabled = useSetting('Accounts_StatusVisibility_Enabled', false) && adminStatusHidingEnabled;
	const customStatusExpiration = useExpirationText(user?.statusExpiresAt);

	return useMemo<GenericMenuItemProps[]>(() => {
		if (userPresenceDisabled || workspacePresenceDisabled) {
			return [
				{
					id: 'user-status-disabled',
					status: <UserStatus status={UserStatusEnum.OFFLINE} />,
					content: t('Offline'),
					addon: <UserStatusDisabledInfo workspace={workspacePresenceDisabled} />,
				},
			];
		}

		if (presenceDisabled) {
			return [
				{
					id: 'presence-disabled',
					content: (
						<Box fontScale='p2'>
							<Box marginBlockEnd={4} wordBreak='break-word' style={{ whiteSpace: 'normal' }}>
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
		if (user?.statusText || customStatusExpiration) {
			const contentValue = user?.statusText || (user?.status ? t(user.status) : undefined);
			items.push({
				id: 'current-custom-status',
				status: <UserStatus status={user?.status} />,
				content: (
					<>
						{contentValue && <MarkdownText withTruncatedText content={contentValue} parseEmoji variant='inline' />}
						{customStatusExpiration && (
							<Box color='secondary-info' display='flex' alignItems='center' gap={4}>
								<Icon name='clock' size='x16' />
								{customStatusExpiration}
							</Box>
						)}
					</>
				),
				addon: <RadioButton checked readOnly />,
			});
		}

		// "Custom..." action opens the edit modal
		if (allowUserStatusMessageChange) {
			items.push({
				id: 'custom-status-edit',
				icon: 'edit',
				content: t('Custom_Status'),
				onClick: handleCustomStatus,
			});
		}

		const isPresetSelected = (statusType: UserStatusEnum): boolean =>
			!user?.statusText && !customStatusExpiration && user?.status === statusType;
		const availableStatuses = (statuses ?? []).filter((status) => invisibleAllowed || status.statusType !== UserStatusEnum.OFFLINE);

		const presetItems = availableStatuses
			.filter((s) => userStatuses.isValidType(s.id))
			.map((status): GenericMenuItemProps => ({
				id: status.id,
				status: <UserStatus status={status.statusType} />,
				content: <MarkdownText content={status.localizeName ? t(status.name) : status.name} parseEmoji variant='inline' />,
				addon: <RadioButton checked={isPresetSelected(status.statusType)} readOnly />,
				onClick: () => setStatusMutation.mutate(status),
			}));

		// Admin-defined custom statuses
		const customItems = allowUserStatusMessageChange
			? availableStatuses
					.filter((s) => !userStatuses.isValidType(s.id))
					.map((status): GenericMenuItemProps => ({
						id: status.id,
						status: <UserStatus status={status.statusType} />,
						content: (
							<MarkdownText withTruncatedText content={status.localizeName ? t(status.name) : status.name} parseEmoji variant='inline' />
						),
						addon: <RadioButton checked={user?.statusText === status.name} readOnly />,
						onClick: () => setStatusMutation.mutate(status),
					}))
			: [];

		const actionItems: GenericMenuItemProps[] = [];

		if (statusVisibilityEnabled) {
			actionItems.push({
				id: 'status-visibility-edit',
				icon: 'eye-off',
				content: t('Accounts_StatusVisibility_HideFrom'),
				onClick: handleStatusVisibility,
			});
		}

		return [...items, ...presetItems, ...customItems, ...actionItems];
	}, [
		presenceDisabled,
		userPresenceDisabled,
		workspacePresenceDisabled,
		allowUserStatusMessageChange,
		t,
		handleStatusDisabledModal,
		user?.status,
		user?.statusText,
		customStatusExpiration,
		statuses,
		invisibleAllowed,
		handleCustomStatus,
		handleStatusVisibility,
		statusVisibilityEnabled,
		setStatusMutation,
	]);
};
