import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useDocumentTitle } from '@rocket.chat/ui-client';
import { useCustomSound, useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useEffect, useCallback } from 'react';

import { useUnreadMessages } from './hooks/useUnreadMessages';
import { useMedsenseQueue } from '../../hooks/medsense/useMedsenseQueue';
import { useMedsenseQueueDelta } from '../../hooks/medsense/useMedsenseQueueDelta';
import MedsenseNotificationPet from '../medsense/pet/MedsenseNotificationPet';

const useRouteTitleFocus = () => {
	return useCallback((node: HTMLElement | null) => {
		if (!node) {
			return;
		}

		// If the parent element has aria-hidden set to true, it means the element is not visible to screen readers.
		// This is a common practice to hide elements that are not currently in use or are not relevant to the user.
		// For example, a modal or popover might be open, and the main content is hidden to keep the user's focus on the modal.
		// Since the title is marked with `tabIndex={-1}`, it is not reachable by keyboard navigation.
		// https://accessibilityinsights.io/info-examples/web/aria-hidden-focus/
		if (node.parentElement?.ariaHidden !== 'true') {
			node.focus();
		}
	}, []);
};

type DocumentTitleWrapperProps = {
	children?: ReactNode;
};

const DocumentTitleWrapper = ({ children }: DocumentTitleWrapperProps) => {
	useDocumentTitle(useSetting('Site_Name', ''), false);
	const unreadMessagesTitle = useDocumentTitle(useUnreadMessages(), false);

	const { canViewQueue } = useMedsenseQueue();
	const { hasNewRequests, newRequestsCount } = useMedsenseQueueDelta();
	const medsenseQueueNotificationsEnabled = useUserPreference<boolean>('medsenseQueueNotificationsEnabled', true);
	const medsenseQueueNotificationSound = useUserPreference<string>('medsenseQueueNotificationSound', 'beep');
	const customSound = useCustomSound();

	useEffect(() => {
		if (hasNewRequests && medsenseQueueNotificationsEnabled) {
			customSound.play(medsenseQueueNotificationSound);
		}
	}, [hasNewRequests, medsenseQueueNotificationsEnabled, medsenseQueueNotificationSound, customSound]);

	const getTitle = () => {
		let newTitle = unreadMessagesTitle.title;
		if (canViewQueue && newRequestsCount > 0) {
			// If the title already has unread messages (e.g., "(3) ..."), insert the queue count
			// Expected format: "(Unread) (Queue) Site Name" or similar combination
			// This matches user request: "Add queue request count to the page title (alongside unread count)."
			// Current unreadMessagesTitle.title might be "(N) Site Name" or just "Site Name"

			// Simple append strategy to start prefix
			const queueString = `(${newRequestsCount} new req)`;
			newTitle = `${queueString} ${newTitle}`;
		}
		return newTitle;
	};

	const title = getTitle();
	const key = unreadMessagesTitle.key + (canViewQueue && newRequestsCount > 0 ? `_queue_${newRequestsCount}` : '');

	const refocusRef = useRouteTitleFocus();

	useEffect(() => {
		document.title = title;
	}, [title]);

	return (
		<>
			<Box
				tabIndex={-1}
				ref={refocusRef}
				key={key}
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
			<MedsenseNotificationPet />
		</>
	);
};

export default DocumentTitleWrapper;
