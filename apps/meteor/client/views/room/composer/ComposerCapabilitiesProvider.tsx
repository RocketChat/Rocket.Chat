import type { IRoom } from '@rocket.chat/core-typings';
import { useLayout, usePermission, useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { ComposerCapabilitiesContext } from './ComposerCapabilitiesContext';
import { useIsFederationEnabled } from '../../../hooks/useIsFederationEnabled';

type ComposerCapabilitiesProviderProps = {
	rid: IRoom['_id'];
	children?: ReactNode;
};

/** Reads once, for a room's composer, the settings, preferences and permissions its message box and actions depend on */
const ComposerCapabilitiesProvider = ({ rid, children }: ComposerCapabilitiesProviderProps) => {
	const { isMobile } = useLayout();
	const sendOnEnterBehavior = useUserPreference<'normal' | 'alternative' | 'desktop'>('sendOnEnter') || isMobile;
	const sendOnEnter = sendOnEnterBehavior == null || sendOnEnterBehavior === 'normal' || (sendOnEnterBehavior === 'desktop' && !isMobile);
	const useEmojis = Boolean(useUserPreference<boolean>('useEmojis'));
	const quoteChainLimit = useSetting('Message_QuoteChainLimit', 2);
	const federationEnabled = useIsFederationEnabled();

	const fileUploadEnabled = useSetting('FileUpload_Enabled', true);
	const audioRecorderEnabled = useSetting('Message_AudioRecorderEnabled', true);
	const videoRecorderEnabled = useSetting('Message_VideoRecorderEnabled', true);
	const mediaTypeBlackList = useSetting('FileUpload_MediaTypeBlackList', '');
	const mediaTypeWhiteList = useSetting('FileUpload_MediaTypeWhiteList', '');
	const webdavEnabled = useSetting('Webdav_Integration_Enabled', false);
	const discussionEnabled = useSetting('Discussion_enabled', true);
	const canStartDiscussion = usePermission('start-discussion', rid);
	const canStartDiscussionOtherUser = usePermission('start-discussion-other-user', rid);
	const mapViewEnabled = useSetting('MapView_Enabled') === true;
	const googleMapsApiKey = useSetting('MapView_GMapsAPIKey', '');

	const value = useMemo(
		() => ({
			isMobile,
			sendOnEnter,
			useEmojis,
			quoteChainLimit,
			federationEnabled,
			fileUploadEnabled,
			audioRecorderEnabled,
			videoRecorderEnabled,
			mediaTypeBlackList,
			mediaTypeWhiteList,
			webdavEnabled,
			discussionEnabled,
			canStartDiscussion,
			canStartDiscussionOtherUser,
			mapViewEnabled,
			googleMapsApiKey,
		}),
		[
			isMobile,
			sendOnEnter,
			useEmojis,
			quoteChainLimit,
			federationEnabled,
			fileUploadEnabled,
			audioRecorderEnabled,
			videoRecorderEnabled,
			mediaTypeBlackList,
			mediaTypeWhiteList,
			webdavEnabled,
			discussionEnabled,
			canStartDiscussion,
			canStartDiscussionOtherUser,
			mapViewEnabled,
			googleMapsApiKey,
		],
	);

	return <ComposerCapabilitiesContext.Provider value={value}>{children}</ComposerCapabilitiesContext.Provider>;
};

export default ComposerCapabilitiesProvider;
