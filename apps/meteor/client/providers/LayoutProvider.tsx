import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { LayoutContext, useRouter, useSetting } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useMemo, useState, useEffect } from 'react';

const roomToolbox = [
	'channel-settings',
	'team-info',
	'user-info-group',
	'user-info',
	// 'thread',
	'calls',
	'canned-responses',
	'clean-history',
	'contact-chat-history',
	'contact-profile',
	'discussions',
	'export-messages',
	'keyboard-shortcut-list',
	'members-list',
	'mentions',
	'otr',
	'pinned-messages',
	'push-notifications',
	'rocket-search',
	'room-info',
	'starred-messages',
	'start-call',
	'team-channels',
	'uploaded-files-list',
	'voip-room-info',
];

const messageToolbox = [
	'reaction-message',
	// 'quote-message',
	'reply-in-thread',
	'forward-message',
	'reply-directly',
	'follow-message',
	'pin-message',
	'star-message',
	'permalink',
	'copy',
	'edit-message',
	'delete-message',
];

const composerToolbox = ['video', 'audio', 'attachment', 'discussion', 'webdav', 'location', 'apps'];

const LayoutProvider: FC = ({ children }) => {
	const showTopNavbarEmbeddedLayout = Boolean(useSetting('UI_Show_top_navbar_embedded_layout'));
	const [isCollapsed, setIsCollapsed] = useState(false);
	const breakpoints = useBreakpoints(); // ["xs", "sm", "md", "lg", "xl", xxl"]

	const router = useRouter();
	// Once the layout is embedded, it can't be changed
	const [isEmbedded] = useState(() => router.getSearchParameters().layout === 'embedded');

	const isMobile = !breakpoints.includes('md');

	useEffect(() => {
		setIsCollapsed(isMobile);
	}, [isMobile]);

	return (
		<LayoutContext.Provider
			children={children}
			value={useMemo(
				() => ({
					isMobile,
					isEmbedded,
					showTopNavbarEmbeddedLayout,
					sidebar: {
						isCollapsed,
						toggle: () => setIsCollapsed((isCollapsed) => !isCollapsed),
						collapse: () => setIsCollapsed(true),
						expand: () => setIsCollapsed(false),
						close: () => (isEmbedded ? setIsCollapsed(true) : router.navigate('/home')),
					},
					size: {
						sidebar: '240px',
						// eslint-disable-next-line no-nested-ternary
						contextualBar: breakpoints.includes('sm') ? (breakpoints.includes('xl') ? '38%' : '380px') : '100%',
					},
					roomToolboxExpanded: breakpoints.includes('lg'),
					contextualBarExpanded: breakpoints.includes('sm'),
					// eslint-disable-next-line no-nested-ternary
					contextualBarPosition: breakpoints.includes('sm') ? (breakpoints.includes('lg') ? 'relative' : 'absolute') : 'fixed',
					hiddenActions: {
						roomToolbox,
						messageToolbox,
						composerToolbox,
					},
				}),
				[isMobile, isEmbedded, showTopNavbarEmbeddedLayout, isCollapsed, breakpoints, router],
			)}
		/>
	);
};

export default LayoutProvider;
