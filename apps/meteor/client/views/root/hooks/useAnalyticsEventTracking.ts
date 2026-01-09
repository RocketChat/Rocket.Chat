import { clientCallbacks } from '@rocket.chat/ui-client';
import { useRouter, useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

function trackEvent(category: string, action: string, label?: unknown) {
	const { _paq, ga } = window;

	_paq?.push(['trackEvent', category, action, label]);
	ga?.('send', 'event', category, action, label);
}

export const useAnalyticsEventTracking = () => {
	const router = useRouter();

	useEffect(
		() =>
			router.subscribeToRouteChange(() => {
				const { _paq, ga } = window;

				if (_paq) {
					const http = location.protocol;
					const slashes = http.concat('//');
					const host = slashes.concat(location.hostname);
					_paq.push(['setCustomUrl', host + router.getLocationPathname()]);
					_paq.push(['trackPageView']);
				}

				ga?.('send', 'pageview', router.getLocationPathname());
			}),
		[router],
	);

	useEffect(() => {
		clientCallbacks.add(
			'loginPageStateChange',
			(state) => {
				trackEvent('Navigation', 'Login Page State Change', state);
			},
			clientCallbacks.priority.MEDIUM,
			'analytics-login-state-change',
		);

		return () => {
			clientCallbacks.remove('loginPageStateChange', 'analytics-login-state-change');
		};
	}, []);

	const featuresMessages = useSetting('Analytics_features_messages', true);

	useEffect(() => {
		if (!featuresMessages) {
			return;
		}

		clientCallbacks.add(
			'afterSaveMessage',
			(_message, { room }) => {
				trackEvent('Message', 'Send', `${room.name} (${room._id})`);
			},
			clientCallbacks.priority.LOW,
			'trackEvents',
		);

		return () => {
			clientCallbacks.remove('afterSaveMessage', 'trackEvents');
		};
	}, [featuresMessages]);

	const featuresRooms = useSetting('Analytics_features_rooms', true);

	useEffect(() => {
		if (!featuresRooms) {
			return;
		}

		clientCallbacks.add(
			'afterCreateChannel',
			(_owner, room) => {
				trackEvent('Room', 'Create', `${room.name} (${room._id})`);
			},
			clientCallbacks.priority.MEDIUM,
			'analytics-after-create-channel',
		);

		clientCallbacks.add(
			'roomNameChanged',
			(room) => {
				trackEvent('Room', 'Changed Name', `${room.name} (${room._id})`);
			},
			clientCallbacks.priority.MEDIUM,
			'analytics-room-name-changed',
		);

		clientCallbacks.add(
			'roomTopicChanged',
			(room) => {
				trackEvent('Room', 'Changed Topic', `${room.name} (${room._id})`);
			},
			clientCallbacks.priority.MEDIUM,
			'analytics-room-topic-changed',
		);

		clientCallbacks.add(
			'roomAnnouncementChanged',
			(room) => {
				trackEvent('Room', 'Changed Announcement', `${room.name} (${room._id})`);
			},
			clientCallbacks.priority.MEDIUM,
			'analytics-room-announcement-changed',
		);

		clientCallbacks.add(
			'roomTypeChanged',
			(room) => {
				trackEvent('Room', 'Changed Room Type', `${room.name} (${room._id})`);
			},
			clientCallbacks.priority.MEDIUM,
			'analytics-room-type-changed',
		);

		clientCallbacks.add(
			'archiveRoom',
			(room) => {
				trackEvent('Room', 'Archived', `${room.name} (${room._id})`);
			},
			clientCallbacks.priority.MEDIUM,
			'analytics-archive-room',
		);

		clientCallbacks.add(
			'unarchiveRoom',
			(room) => {
				trackEvent('Room', 'Unarchived', `${room.name} (${room._id})`);
			},
			clientCallbacks.priority.MEDIUM,
			'analytics-unarchive-room',
		);

		clientCallbacks.add(
			'roomAvatarChanged',
			(room) => {
				trackEvent('Room', 'Changed Avatar', `${room.name} (${room._id})`);
			},
			clientCallbacks.priority.MEDIUM,
			'analytics-room-avatar-changed',
		);

		return () => {
			clientCallbacks.remove('afterCreateChannel', 'analytics-after-create-channel');
			clientCallbacks.remove('roomNameChanged', 'analytics-room-name-changed');
			clientCallbacks.remove('roomTopicChanged', 'analytics-room-topic-changed');
			clientCallbacks.remove('roomAnnouncementChanged', 'analytics-room-announcement-changed');
			clientCallbacks.remove('roomTypeChanged', 'analytics-room-type-changed');
			clientCallbacks.remove('archiveRoom', 'analytics-archive-room');
			clientCallbacks.remove('unarchiveRoom', 'analytics-unarchive-room');
			clientCallbacks.remove('roomAvatarChanged', 'analytics-room-avatar-changed');
		};
	}, [featuresRooms]);

	const featuresUsers = useSetting('Analytics_features_users', true);

	useEffect(() => {
		if (!featuresUsers) {
			return;
		}

		clientCallbacks.add(
			'userRegistered',
			() => {
				trackEvent('User', 'Registered');
			},
			clientCallbacks.priority.MEDIUM,
			'piwik-user-resitered',
		);

		clientCallbacks.add(
			'usernameSet',
			() => {
				trackEvent('User', 'Username Set');
			},
			clientCallbacks.priority.MEDIUM,
			'piweik-username-set',
		);

		clientCallbacks.add(
			'userPasswordReset',
			() => {
				trackEvent('User', 'Reset Password');
			},
			clientCallbacks.priority.MEDIUM,
			'piwik-user-password-reset',
		);

		clientCallbacks.add(
			'userConfirmationEmailRequested',
			() => {
				trackEvent('User', 'Confirmation Email Requested');
			},
			clientCallbacks.priority.MEDIUM,
			'piwik-user-confirmation-email-requested',
		);

		clientCallbacks.add(
			'userForgotPasswordEmailRequested',
			() => {
				trackEvent('User', 'Forgot Password Email Requested');
			},
			clientCallbacks.priority.MEDIUM,
			'piwik-user-forgot-password-email-requested',
		);

		clientCallbacks.add(
			'userStatusManuallySet',
			(status) => {
				trackEvent('User', 'Status Manually Changed', status);
			},
			clientCallbacks.priority.MEDIUM,
			'analytics-user-status-manually-set',
		);

		clientCallbacks.add(
			'userAvatarSet',
			(service) => {
				trackEvent('User', 'Avatar Changed', service);
			},
			clientCallbacks.priority.MEDIUM,
			'analytics-user-avatar-set',
		);

		return () => {
			clientCallbacks.remove('userRegistered', 'piwik-user-resitered');
			clientCallbacks.remove('usernameSet', 'piweik-username-set');
			clientCallbacks.remove('userPasswordReset', 'piwik-user-password-reset');
			clientCallbacks.remove('userConfirmationEmailRequested', 'piwik-user-confirmation-email-requested');
			clientCallbacks.remove('userForgotPasswordEmailRequested', 'piwik-user-forgot-password-email-requested');
			clientCallbacks.remove('userStatusManuallySet', 'analytics-user-status-manually-set');
			clientCallbacks.remove('userAvatarSet', 'analytics-user-avatar-set');
		};
	}, [featuresUsers]);

	const uid = useUserId();

	useEffect(() => {
		if (!featuresUsers) {
			return;
		}

		const { _paq } = window;

		trackEvent('User', 'Login', uid);
		_paq?.push(['setUserId', uid]);

		return () => {
			trackEvent('User', 'Logout', uid);
		};
	}, [featuresUsers, uid]);
};
