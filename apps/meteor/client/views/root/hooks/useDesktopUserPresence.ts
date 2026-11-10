import { UserStatus } from '@rocket.chat/core-typings';
import type { DesktopCustomUserStatus, DesktopUserPresence, DesktopUserStatus } from '@rocket.chat/desktop-api';
import { useConnectionStatus, useIsLoggingIn, useSetting, useUser, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo } from 'react';

import { useSetUserStatus } from '../../../hooks/useSetUserStatus';
import { useUserStatuses } from '../../../hooks/useUserStatuses';
import { userStatuses } from '../../../lib/userStatuses';
import { callDesktopBridge } from '../../../lib/utils/callDesktopBridge';

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
	const userId = useUserId();
	const user = useUser();
	const isLoggingIn = useIsLoggingIn();
	const { status: connectionStatus } = useConnectionStatus();
	const invisibleAllowed = useSetting('Accounts_AllowInvisibleStatusOption', true);
	const presenceBroadcastDisabled = useSetting('Presence_broadcast_disabled', false);
	const workspacePresenceDisabled = useSetting('Accounts_UserStatus_Enabled', true) === false;
	const adminStatusHidingEnabled = useSetting('Accounts_StatusVisibility_Admin_Enabled', false);
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange', true);
	const { mutateAsync: setUserStatus } = useSetUserStatus();

	// A resumed session sets the user id before the user record arrives. Read the login state from the id, so the
	// desktop app does not see a logout in between.
	const loggedIn = Boolean(userId);
	const userLoaded = Boolean(user);
	// Only a desktop app with the presence contract reads the statuses. Layouts without the user menu do not share the query.
	const desktopReadsPresence = typeof window.RocketChatDesktop?.setUserPresenceState === 'function';
	const statuses = useUserStatuses({ enabled: loggedIn && desktopReadsPresence });
	const connection = toDesktopConnection(connectionStatus);
	const status = isDesktopStatus(user?.status) ? user.status : undefined;
	const statusText = user?.statusText || undefined;
	const statusExpiresAt = user?.statusExpiresAt ? new Date(user.statusExpiresAt).toISOString() : undefined;
	const presenceDisabled =
		presenceBroadcastDisabled || workspacePresenceDisabled || (user?.presenceDisabledByAdmin === true && adminStatusHidingEnabled);

	const availableStatuses = useMemo<DesktopUserStatus[]>(
		() => (!userLoaded || presenceDisabled ? [] : desktopStatuses.filter((status) => invisibleAllowed || status !== 'offline')),
		[userLoaded, presenceDisabled, invisibleAllowed],
	);

	const customStatuses = useMemo<DesktopCustomUserStatus[]>(() => {
		if (!userLoaded || presenceDisabled || !allowUserStatusMessageChange) {
			return [];
		}

		return (statuses ?? []).flatMap(({ id, name, statusType }) =>
			!userStatuses.isValidType(id) && isDesktopStatus(statusType) && (invisibleAllowed || statusType !== UserStatus.OFFLINE)
				? [{ id, name, status: statusType }]
				: [],
		);
	}, [userLoaded, presenceDisabled, allowUserStatusMessageChange, statuses, invisibleAllowed]);

	useEffect(() => {
		callDesktopBridge((desktop) =>
			desktop.setUserStatusChangeHandler?.(async ({ status, customStatusId }) => {
				const descriptor = Array.from(userStatuses).find(({ id }) => id === (customStatusId ?? status));
				if (!descriptor) {
					throw new Error(`Unknown user status: ${customStatusId ?? status}`);
				}

				await setUserStatus(descriptor);
			}),
		);
	}, [setUserStatus]);

	useEffect(() => {
		// The user id is not known until a stored session resumes. The desktop app deletes the login data of the workspace
		// when it sees a logout, so a logout reported before the resume ends logs the user out.
		if (!loggedIn && isLoggingIn) {
			return;
		}

		callDesktopBridge((desktop) =>
			desktop.setUserPresenceState?.({
				loggedIn,
				connection,
				status,
				statusText,
				statusExpiresAt,
				availableStatuses,
				customStatuses,
			}),
		);
	}, [loggedIn, isLoggingIn, connection, status, statusText, statusExpiresAt, availableStatuses, customStatuses]);
};
