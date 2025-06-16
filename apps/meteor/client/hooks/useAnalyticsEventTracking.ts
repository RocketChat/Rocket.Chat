import { useRouter, useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { callbacks } from '../../lib/callbacks';

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
		callbacks.add(
			'loginPageStateChange',
			(state) => {
				trackEvent('Navigation', 'Login Page State Change', state);
			},
			callbacks.priority.MEDIUM,
			'analytics-login-state-change',
		);

		return () => {
			callbacks.remove('loginPageStateChange', 'analytics-login-state-change');
		};
	}, []);

	const featuresMessages = useSetting('Analytics_features_messages', true);

	useEffect(() => {
		if (!featuresMessages) {
			return;
		}

		callbacks.add(
			'afterSaveMessage',
			(_message, { room }) => {
				trackEvent('Message', 'Send', `${room.name} (${room._id})`);
			},
			callbacks.priority.LOW,
			'trackEvents',
		);

		return () => {
			callbacks.remove('afterSaveMessage', 'trackEvents');
		};
	}, [featuresMessages]);

	const featuresRooms = useSetting('Analytics_features_rooms', true);

	useEffect(() => {
		if (!featuresRooms) {
			return;
		}

		callbacks.add(
			'afterCreateChannel',
			(_owner, room) => {
				trackEvent('Room', 'Create', `${room.name} (${room._id})`);
			},
			callbacks.priority.MEDIUM,
			'analytics-after-create-channel',
		);

		callbacks.add(
			'roomNameChanged',
			(room) => {
				trackEvent('Room', 'Changed Name', `${room.name} (${room._id})`);
			},
			callbacks.priority.MEDIUM,
			'analytics-room-name-changed',
		);

		callbacks.add(
			'roomTopicChanged',
			(room) => {
				trackEvent('Room', 'Changed Topic', `${room.name} (${room._id})`);
			},
			callbacks.priority.MEDIUM,
			'analytics-room-topic-changed',
		);

		callbacks.add(
			'roomAnnouncementChanged',
			(room) => {
				trackEvent('Room', 'Changed Announcement', `${room.name} (${room._id})`);
			},
			callbacks.priority.MEDIUM,
			'analytics-room-announcement-changed',
		);

		callbacks.add(
			'roomTypeChanged',
			(room) => {
				trackEvent('Room', 'Changed Room Type', `${room.name} (${room._id})`);
			},
			callbacks.priority.MEDIUM,
			'analytics-room-type-changed',
		);

		callbacks.add(
			'archiveRoom',
			(room) => {
				trackEvent('Room', 'Archived', `${room.name} (${room._id})`);
			},
			callbacks.priority.MEDIUM,
			'analytics-archive-room',
		);

		callbacks.add(
			'unarchiveRoom',
			(room) => {
				trackEvent('Room', 'Unarchived', `${room.name} (${room._id})`);
			},
			callbacks.priority.MEDIUM,
			'analytics-unarchive-room',
		);

		callbacks.add(
			'roomAvatarChanged',
			(room) => {
				trackEvent('Room', 'Changed Avatar', `${room.name} (${room._id})`);
			},
			callbacks.priority.MEDIUM,
			'analytics-room-avatar-changed',
		);

		return () => {
			callbacks.remove('afterCreateChannel', 'analytics-after-create-channel');
			callbacks.remove('roomNameChanged', 'analytics-room-name-changed');
			callbacks.remove('roomTopicChanged', 'analytics-room-topic-changed');
			callbacks.remove('roomAnnouncementChanged', 'analytics-room-announcement-changed');
			callbacks.remove('roomTypeChanged', 'analytics-room-type-changed');
			callbacks.remove('archiveRoom', 'analytics-archive-room');
			callbacks.remove('unarchiveRoom', 'analytics-unarchive-room');
			callbacks.remove('roomAvatarChanged', 'analytics-room-avatar-changed');
		};
	}, [featuresRooms]);

	const featuresUsers = useSetting('Analytics_features_users', true);

	useEffect(() => {
		if (!featuresUsers) {
			return;
		}

		callbacks.add(
			'userRegistered',
			() => {
				trackEvent('User', 'Registered');
			},
			callbacks.priority.MEDIUM,
			'piwik-user-resitered',
		);

		callbacks.add(
			'usernameSet',
			() => {
				trackEvent('User', 'Username Set');
			},
			callbacks.priority.MEDIUM,
			'piweik-username-set',
		);

		callbacks.add(
			'userPasswordReset',
			() => {
				trackEvent('User', 'Reset Password');
			},
			callbacks.priority.MEDIUM,
			'piwik-user-password-reset',
		);

		callbacks.add(
			'userConfirmationEmailRequested',
			() => {
				trackEvent('User', 'Confirmation Email Requested');
			},
			callbacks.priority.MEDIUM,
			'piwik-user-confirmation-email-requested',
		);

		callbacks.add(
			'userForgotPasswordEmailRequested',
			() => {
				trackEvent('User', 'Forgot Password Email Requested');
			},
			callbacks.priority.MEDIUM,
			'piwik-user-forgot-password-email-requested',
		);

		callbacks.add(
			'userStatusManuallySet',
			(status) => {
				trackEvent('User', 'Status Manually Changed', status);
			},
			callbacks.priority.MEDIUM,
			'analytics-user-status-manually-set',
		);

		callbacks.add(
			'userAvatarSet',
			(service) => {
				trackEvent('User', 'Avatar Changed', service);
			},
			callbacks.priority.MEDIUM,
			'analytics-user-avatar-set',
		);

		return () => {
			callbacks.remove('userRegistered', 'piwik-user-resitered');
			callbacks.remove('usernameSet', 'piweik-username-set');
			callbacks.remove('userPasswordReset', 'piwik-user-password-reset');
			callbacks.remove('userConfirmationEmailRequested', 'piwik-user-confirmation-email-requested');
			callbacks.remove('userForgotPasswordEmailRequested', 'piwik-user-forgot-password-email-requested');
			callbacks.remove('userStatusManuallySet', 'analytics-user-status-manually-set');
			callbacks.remove('userAvatarSet', 'analytics-user-avatar-set');
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
