import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { RouteName } from '@rocket.chat/ui-contexts';
import { useUserSubscription, useRouter, useSession, useSetting } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useCallback, useState, useRef, useEffect } from 'react';

import { useUserDisplayName } from '../../hooks/useUserDisplayName';

const routeTitles: Record<RouteName, string | undefined> = {
	'index': undefined,
	'home': 'Home',
	'account-index': undefined,
	'profile': 'Profile',
	'preferences': 'Preferences',
	'security': 'Security',
	'integrations': 'Integrations',
	'tokens': 'Personal access tokens',
	'omnichannel': 'Omnichannel',
	'feature-preview': 'Feature Preview',
	'accessibility-and-appearance': 'Accessibility & appearance',
	'directory': 'Directory',
	'upgrade': 'Go fully featured',
	'admin-info': 'Workspace',
	'cloud': 'Registration',
	'engagement-dashboard': 'Engagement Dashboard',
	'moderation-console': 'Moderation',
	'federation-dashboard': 'Federation',
	'admin-rooms': 'Rooms',
	'admin-users': 'Users',
	'invites': 'Invites',
	'user-status': 'User status',
	'admin-permissions': 'Permissions',
	'device-management': 'Device management',
	'admin-email-inboxes': 'Email inboxes',
	'admin-mailer': 'Mailer',
	'admin-oauth-apps': 'Third-party login',
	'admin-integrations': 'Integrations',
	'admin-import': 'Import',
	'admin-view-logs': 'Reports',
	'custom-sounds': 'Sounds',
	'emoji-custom': 'Emoji',
	'admin-settings': 'Workspace settings',
	'manage-devices': 'Manage Devices',
	'admin-index': undefined,
	'admin-import-progress': undefined,
	'admin-import-new': undefined,
	'admin-import-prepare': undefined,
	'direct': undefined,
	'live': undefined,
	'group': undefined,
	'channel': undefined,
	'voip': undefined,
	'login': undefined,
	'meet': undefined,
	'livechat-queue': undefined,
	'terms-of-service': undefined,
	'privacy-policy': undefined,
	'legal-notice': undefined,
	'omnichannel-directory': undefined,
	'register-secret-url': undefined,
	'invite': undefined,
	'conference': undefined,
	'setup-wizard': undefined,
	'mailer-unsubscribe': undefined,
	'tokenLogin': undefined,
	'resetPassword': undefined,
	'oauth/authorize': undefined,
	'oauth/error': undefined,
	'saml': undefined,
	'audit-home': 'Audit messages',
	'audit-log': 'Audit logs',
	'marketplace-index': undefined,
	'marketplace': 'Marketplace',
	'omnichannel-index': undefined,
	'omnichannel-queue': undefined,
	'omnichannel-rooms': undefined,
	'omnichannel-current-chats': 'Omnichannel - Current chats',
	'omnichannel-analytics': 'Omnichannel - Analytics',
	'omnichannel-realTime': 'Omnichannel - Real-time monitoring',
	'omnichannel-managers': 'Omnichannel - Managers',
	'omnichannel-agents': 'Omnichannel - Agents',
	'omnichannel-departments': 'Omnichannel - Departments',
	'omnichannel-customfields': 'Omnichannel - Custom fields',
	'omnichannel-triggers': 'Omnichannel - Livechat triggers',
	'omnichannel-installation': 'Omnichannel - Installation',
	'omnichannel-appearance': 'Omnichannel - Appearance',
	'omnichannel-webhooks': 'Omnichannel - Webhooks',
	'omnichannel-businessHours': 'Omnichannel - Business hours',
	'omnichannel-reports': 'Omnichannel - Reports',
	'omnichannel-monitors': 'Omnichannel - Monitors',
	'omnichannel-units': 'Omnichannel - Units',
	'omnichannel-canned-responses': 'Omnichannel - Canned responses',
	'omnichannel-tags': 'Omnichannel - Tags',
	'omnichannel-sla-policies': 'Omnichannel - SLA Policies',
	'omnichannel-priorities': 'Omnichannel - Priorities',
};

const DocumentTitleWrapper: FC = ({ children }) => {
	const router = useRouter();
	const refocusRef = useRef<HTMLParagraphElement>(null);

	const routeName = router.getRouteName();
	const siteName = useSetting<string>('Site_Name') || '';
	const routeParams = router.getRouteParameters();

	const [title, setTitle] = useState('');
	const unreadMessages = useSession('unread');

	const subscription = useUserSubscription(routeParams.rid);
	const username = useUserDisplayName({ name: subscription?.fname, username: subscription?.name });

	const renderUnreadMessages = useCallback(() => {
		if (unreadMessages === '') {
			return '';
		}

		return `- ${unreadMessages} unread messages`;
	}, [unreadMessages]);

	useEffect(() => {
		if (refocusRef.current) {
			refocusRef.current.focus();
		}

		document.title = title;
	}, [title]);

	useEffect(() => {
		if (routeName === 'admin-settings' && routeParams.group) {
			return setTitle(`${routeTitles[routeName]} - ${routeParams.group} - ${siteName} ${renderUnreadMessages()}`);
		}

		if ((routeName === 'channel' || routeName === 'group') && routeParams.name) {
			return setTitle(`${routeParams.name} - ${siteName} ${renderUnreadMessages()}`);
		}

		if (routeName === 'direct') {
			return setTitle(`${username} - ${siteName} ${renderUnreadMessages()}`);
		}

		if (routeName && routeTitles[routeName]) {
			return setTitle(`${routeTitles[routeName]} - ${siteName} ${renderUnreadMessages()}`);
		}

		return setTitle(`${siteName} ${renderUnreadMessages()}`);
	}, [renderUnreadMessages, routeName, siteName, routeParams, username]);

	return (
		<Box width='100%' height='100%'>
			<Box
				tabIndex={-1}
				ref={refocusRef}
				className={css`
					position: absolute;
					width: 1px;
					height: 1px;
					padding: 0;
					margin: -1px;
					overflow: hidden;
					clip: rect(0, 0, 0, 0);
					white-space: nowrap;
					border-width: 0;
				`}
			>
				{title}
			</Box>
			{children}
		</Box>
	);
};

export default DocumentTitleWrapper;
