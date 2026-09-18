import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import AudioAttachmentTranscription from './AudioAttachmentTranscription';

export default {
	component: AudioAttachmentTranscription,
	decorators: [
		mockAppRoot()
			.withSetting('AI_Voice_Transcription_Enabled', true)
			.withUserPreference('showVoiceTranscriptions', true)
			.buildStoryDecorator(),
	],
} satisfies Meta<typeof AudioAttachmentTranscription>;

export const Pending: StoryObj<typeof AudioAttachmentTranscription> = {
	args: {
		transcription: {
			status: 'pending',
		},
	},
};

export const Done: StoryObj<typeof AudioAttachmentTranscription> = {
	args: {
		transcription: {
			status: 'done',
			text: 'Hello, this is a short voice message transcript.',
			language: 'en',
			provider: 'whisper-cpp-server',
		},
	},
};

export const DoneLong: StoryObj<typeof AudioAttachmentTranscription> = {
	args: {
		transcription: {
			status: 'done',
			text: Array.from({ length: 40 }, (_, index) => `Sentence number ${index + 1} about the meeting agenda.`).join(' '),
			language: 'en',
			provider: 'openai-compatible',
		},
	},
};

export const Failed: StoryObj<typeof AudioAttachmentTranscription> = {
	args: {
		transcription: {
			status: 'failed',
			error: 'engine-unreachable',
		},
	},
};
