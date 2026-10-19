import { UserStatus } from '@rocket.chat/core-typings';
import type { DesktopCustomUserStatus, DesktopUserPresence, DesktopUserStatus } from '@rocket.chat/desktop-api';
import { useConnectionStatus, useSetting, useUser } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo } from 'react';

import { useSetUserStatus } from '../../../hooks/useSetUserStatus';
import { useUserStatuses } from '../../../hooks/useUserStatuses';
import { userStatuses } from '../../../lib/userStatuses';

const desktopStatuses: DesktopUserStatus[] = ['online', 'away', 'busy', 'offline'];

const isDesktopStatus = (status: string | undefined): status is DesktopUserStatus => desktopStatuses.includes(status as DesktopUserStatus);

const toDesktopConnection = (status: ReturnType<typeof useConnectionStatus>['status']): DesktopUserPresence['connection'] => {
	switch (status) {
		case 'connected':
			return 'connected';
		case 'connecting':
		case 'waiting':
			return 'connecting';
		default:
			return 'disconnected';
	}
};

export const useDesktopUserPresence = () => {
	const user = useUser();
	const { status: connectionStatus } = useConnectionStatus();
	const invisibleAllowed = useSetting('Accounts_AllowInvisibleStatusOption', true);
	const presenceBroadcastDisabled = useSetting('Presence_broadcast_disabled', false);
	const workspacePresenceDisabled = useSetting('Accounts_UserStatus_Enabled', true) === false;
	const adminStatusHidingEnabled = useSetting('Accounts_StatusVisibility_Admin_Enabled', false);
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange', true);
	const { mutateAsync: setUserStatus } = useSetUserStatus();

	const loggedIn = Boolean(user);
	const statuses = useUserStatuses({ enabled: loggedIn });
	const connection = toDesktopConnection(connectionStatus);
	const status = isDesktopStatus(user?.status) ? user.status : undefined;
	const statusText = user?.statusText || undefined;
	const statusExpiresAt = user?.statusExpiresAt ? new Date(user.statusExpiresAt).toISOString() : undefined;
	const presenceDisabled =
		presenceBroadcastDisabled || workspacePresenceDisabled || (user?.presenceDisabledByAdmin === true && adminStatusHidingEnabled);

	const availableStatuses = useMemo<DesktopUserStatus[]>(
		() => (!loggedIn || presenceDisabled ? [] : desktopStatuses.filter((status) => invisibleAllowed || status !== 'offline')),
		[loggedIn, presenceDisabled, invisibleAllowed],
	);

	const customStatuses = useMemo<DesktopCustomUserStatus[]>(() => {
		if (!loggedIn || presenceDisabled || !allowUserStatusMessageChange) {
			return [];
		}

		return (statuses ?? []).flatMap(({ id, name, statusType }) =>
			!userStatuses.isValidType(id) && isDesktopStatus(statusType) && (invisibleAllowed || statusType !== UserStatus.OFFLINE)
				? [{ id, name, status: statusType }]
				: [],
		);
	}, [loggedIn, presenceDisabled, allowUserStatusMessageChange, statuses, invisibleAllowed]);

	useEffect(() => {
		window.RocketChatDesktop?.setUserStatusChangeHandler?.(async ({ status, customStatusId }) => {
			const descriptor = Array.from(userStatuses).find(({ id }) => id === (customStatusId ?? status));
			if (!descriptor) {
				throw new Error(`Unknown user status: ${customStatusId ?? status}`);
			}

			await setUserStatus(descriptor);
		});
	}, [setUserStatus]);

	useEffect(() => {
		window.RocketChatDesktop?.setUserPresenceState?.({
			loggedIn,
			connection,
			status,
			statusText,
			statusExpiresAt,
			availableStatuses,
			customStatuses,
		});
	}, [loggedIn, connection, status, statusText, statusExpiresAt, availableStatuses, customStatuses]);
};
