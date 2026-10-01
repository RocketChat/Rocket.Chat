import { useEndpoint, useSetting, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

export type MediaCallDevice = { id: string; name: string; appId: string };

const APP_EVENTS_AFFECTING_DEVICES = ['app/added', 'app/removed', 'app/updated', 'app/statusUpdate'];

/**
 * Lists the external devices (e.g. desk phones) the current user can place/receive calls on, as
 * provided by installed apps. Empty when the cti feature is off or no cti-capable app is present.
 *
 * Apps own the list, so the cached one is kept until something says it changed: an app reporting the
 * user's devices changed, or an app appearing, going away or being enabled or disabled.
 */
export const useMediaCallDevices = (): MediaCallDevice[] => {
	const uid = useUserId();
	const ctiEnabled = useSetting<boolean>('VoIP_TeamCollab_CTI_Enabled', false);
	const getDevices = useEndpoint('GET', '/v1/media-calls.devices');
	const queryClient = useQueryClient();
	const subscribeToNotifyUser = useStream('notify-user');
	const subscribeToApps = useStream('apps');

	const queryKey = useMemo(() => ['media-calls', 'devices'] as const, []);

	const { data } = useQuery({
		queryKey,
		queryFn: async () => (await getDevices()).devices,
		staleTime: Infinity,
		enabled: ctiEnabled,
	});

	const invalidate = useCallback(() => {
		void queryClient.invalidateQueries({ queryKey });
	}, [queryClient, queryKey]);

	useEffect(() => {
		if (!uid || !ctiEnabled) {
			return;
		}

		return subscribeToNotifyUser(`${uid}/media-call-devices`, invalidate);
	}, [uid, ctiEnabled, invalidate, subscribeToNotifyUser]);

	useEffect(() => {
		if (!uid || !ctiEnabled) {
			return;
		}

		return subscribeToApps('apps', ([key]) => {
			if (APP_EVENTS_AFFECTING_DEVICES.includes(key)) {
				invalidate();
			}
		});
	}, [uid, ctiEnabled, invalidate, subscribeToApps]);

	return data ?? [];
};
