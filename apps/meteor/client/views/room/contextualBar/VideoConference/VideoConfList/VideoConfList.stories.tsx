import { Contextualbar } from '@rocket.chat/ui-client';
import type { Meta } from '@storybook/react';
import { action } from 'storybook/actions';

import VideoConfList from './VideoConfList';
import {
	ongoingCall,
	ongoingCallWithParticipants,
	ongoingCallMaxParticipants,
	ongoingCallWithDiscussion,
	pastCallWithDiscussion,
	pastCallNoDiscussion,
} from './mocks';

export default {
	component: VideoConfList,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
	args: {
		onClose: action('onClose'),
		reload: action('reload'),
		loadMoreItems: action('loadMoreItems'),
		loading: false,
		total: 0,
		videoConfs: [],
	},
} satisfies Meta<typeof VideoConfList>;

export const Loading = {
	args: {
		loading: true,
	},
};

export const Error = {
	args: {
		error: new global.Error('Failed to load conference history'),
		total: 0,
	},
};

export const Empty = {
	args: {
		total: 0,
	},
};

export const OngoingCallNoParticipants = {
	args: {
		total: 1,
		videoConfs: [ongoingCall],
	},
};

export const OngoingCallWithParticipants = {
	args: {
		total: 1,
		videoConfs: [ongoingCallWithParticipants],
	},
};

export const OngoingCallMaxParticipants = {
	args: {
		total: 1,
		videoConfs: [ongoingCallMaxParticipants],
	},
};

export const OngoingCallWithDiscussion = {
	args: {
		total: 1,
		videoConfs: [ongoingCallWithDiscussion],
	},
};

export const PastCallWithDiscussion = {
	args: {
		total: 1,
		videoConfs: [pastCallWithDiscussion],
	},
};

export const PastCallNoDiscussion = {
	args: {
		total: 1,
		videoConfs: [pastCallNoDiscussion],
	},
};

export const MixedSections = {
	args: {
		total: 4,
		videoConfs: [ongoingCall, ongoingCallWithParticipants, pastCallWithDiscussion, pastCallNoDiscussion],
	},
};
