import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isRoomFederated, isThreadMainMessage } from '@rocket.chat/core-typings';
import { useFormatDateAndTime, useFormatTime } from '@rocket.chat/ui-client';
import { useLayout, useSetting, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import type { MessageDisplayContextValue } from '@rocket.chat/ui-message-list';
import { useMemo } from 'react';

import { useAutoTranslate } from '../../hooks/useAutoTranslate';
import { useFormatDate } from '../../hooks/useFormatDate';
import { useKatex } from '../../hooks/useKatex';
import { getRegexHighlight, getRegexHighlightUrl } from '../../lib/highlightWords';

export type UseMessageDisplayValueOptions = {
	room: IRoom | undefined;
	subscription: ISubscription | undefined;
	allowsInteraction: boolean;
};

/** How messages look for the viewer: their settings and preferences, and the translations of the conversation. */
export const useMessageDisplayValue = ({
	room,
	subscription,
	allowsInteraction,
}: UseMessageDisplayValueOptions): MessageDisplayContextValue => {
	const uid = useUserId();
	const { isMobile } = useLayout();

	const federationReadReceipts = useSetting('Federation_Service_EDU_Process_Receipt', false);
	const readReceiptsEnabled =
		useSetting('Message_Read_Receipt_Enabled', false) && (!room || !isRoomFederated(room) || federationReadReceipts);
	const readReceiptsStoreUsers = useSetting('Message_Read_Receipt_Store_Users', false);
	const autoLinkDomains = useSetting('Message_CustomDomain_AutoLink', '');
	const embedsEnabled = useSetting('API_Embed', false);
	const showRealName = useSetting('UI_Use_Real_Name', false);
	const showColors = useSetting('HexColorPreview_Enabled', false);
	const displayRolesGlobal = useSetting('UI_DisplayRoles', true);

	const hideRoles = useUserPreference<boolean>('hideRoles');
	const hideUsernames = useUserPreference<boolean>('hideUsernames');
	const showAvatars = !!useUserPreference<boolean>('displayAvatars');
	const highlightWords = useUserPreference<string[]>('highlights');

	const { katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled } = useKatex();
	const { showAutoTranslate } = useAutoTranslate(subscription);

	const formatTime = useFormatTime();
	const formatDate = useFormatDate();
	const formatDateAndTime = useFormatDateAndTime();

	const hasSubscription = !!subscription;

	const highlights = useMemo(
		() =>
			highlightWords
				?.map((word) => word.trim())
				.map((highlight) => ({ highlight, regex: getRegexHighlight(highlight), urlRegex: getRegexHighlightUrl(highlight) })),
		[highlightWords],
	);

	return useMemo(
		() => ({
			showRoles: displayRolesGlobal && !hideRoles && !isMobile,
			showRealName,
			showUsername: !hideUsernames && !isMobile,
			showColors,
			showAvatars,
			readReceipts: { enabled: readReceiptsEnabled, storeUsers: readReceiptsStoreUsers },
			embedsEnabled,
			highlights,
			katex: katexEnabled
				? { dollarSyntaxEnabled: katexDollarSyntaxEnabled, parenthesisSyntaxEnabled: katexParenthesisSyntaxEnabled }
				: undefined,
			autoLinkDomains,
			formatTime,
			formatDate,
			formatDateAndTime,
			isTranslated: (message: IMessage) => showAutoTranslate(message),
			isStarred: (message: IMessage) => hasSubscription && !!message.starred?.some((star) => star._id === uid),
			isFollowing: (message: IMessage) => !!uid && !!message.replies?.includes(uid) && !isThreadMainMessage(message),
			allowsInteraction,
		}),
		[
			displayRolesGlobal,
			hideRoles,
			isMobile,
			showRealName,
			hideUsernames,
			showColors,
			showAvatars,
			readReceiptsEnabled,
			readReceiptsStoreUsers,
			embedsEnabled,
			highlights,
			katexEnabled,
			katexDollarSyntaxEnabled,
			katexParenthesisSyntaxEnabled,
			autoLinkDomains,
			formatTime,
			formatDate,
			formatDateAndTime,
			showAutoTranslate,
			hasSubscription,
			uid,
			allowsInteraction,
		],
	);
};
