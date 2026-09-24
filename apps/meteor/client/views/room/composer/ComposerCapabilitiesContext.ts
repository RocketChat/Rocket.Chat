import { createContext, useContext } from 'react';

/** What the message composer of a room lets its user do, and how it behaves for them */
export type ComposerCapabilities = {
	isMobile: boolean;
	sendOnEnter: boolean;
	useEmojis: boolean;
	quoteChainLimit: number;
	federationEnabled: boolean;
	fileUploadEnabled: boolean;
	audioRecorderEnabled: boolean;
	videoRecorderEnabled: boolean;
	mediaTypeBlackList: string;
	mediaTypeWhiteList: string;
	webdavEnabled: boolean;
	discussionEnabled: boolean;
	canStartDiscussion: boolean;
	canStartDiscussionOtherUser: boolean;
	mapViewEnabled: boolean;
	googleMapsApiKey: string;
};

export const defaultComposerCapabilities: ComposerCapabilities = {
	isMobile: false,
	sendOnEnter: true,
	useEmojis: false,
	quoteChainLimit: 2,
	federationEnabled: false,
	fileUploadEnabled: true,
	audioRecorderEnabled: true,
	videoRecorderEnabled: true,
	mediaTypeBlackList: '',
	mediaTypeWhiteList: '',
	webdavEnabled: false,
	discussionEnabled: true,
	canStartDiscussion: false,
	canStartDiscussionOtherUser: false,
	mapViewEnabled: false,
	googleMapsApiKey: '',
};

export const ComposerCapabilitiesContext = createContext<ComposerCapabilities>(defaultComposerCapabilities);

export const useComposerCapabilities = (): ComposerCapabilities => useContext(ComposerCapabilitiesContext);
