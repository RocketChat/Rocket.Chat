import type { MessageAttachmentBase, MessageAttachmentDefault, MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import Attachments from './Attachments';

const image = `data:image/svg+xml;utf8,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#9ea2a8"/></svg>',
)}`;

const source = { rid: 'room', mid: 'message', username: 'alice', name: 'Alice' };

const fileAttachment = {
	type: 'file',
	title: 'quarterly-report.pdf',
	title_link: '/file-upload/report/quarterly-report.pdf',
	title_link_download: true,
	size: 245_760,
	format: 'PDF',
} as MessageAttachmentBase;

const imageAttachment = {
	type: 'file',
	title: 'diagram.svg',
	title_link: image,
	title_link_download: true,
	image_url: image,
	image_dimensions: { width: 320, height: 180 },
	image_alt: 'A grey rectangle',
	image_size: 2048,
	description: 'The architecture diagram',
} as MessageAttachmentBase;

const audioAttachment = {
	type: 'file',
	title: 'voice-note.mp3',
	title_link: '/file-upload/voice/voice-note.mp3',
	audio_url: '/file-upload/voice/voice-note.mp3',
	audio_type: 'audio/mpeg',
	audio_size: 48_000,
} as MessageAttachmentBase;

const videoAttachment = {
	type: 'file',
	title: 'demo.mp4',
	title_link: '/file-upload/video/demo.mp4',
	video_url: '/file-upload/video/demo.mp4',
	video_type: 'video/mp4',
	video_size: 1_048_576,
} as MessageAttachmentBase;

const quoteAttachment: MessageQuoteAttachment = {
	text: 'Can we ship this on Friday?',
	author_name: 'bob',
	author_icon: image,
	author_link: '/direct/bob',
	message_link: '/channel/general?msg=quoted',
	ts: new Date('2024-03-10T15:20:00.000Z'),
};

const defaultAttachment: MessageAttachmentDefault = {
	color: '#2de0a5',
	author_name: 'CI',
	pretext: 'Build finished',
	title: 'Pipeline #4521',
	title_link: 'https://example.com/pipelines/4521',
	text: 'All 312 checks passed.',
	fields: [
		{ short: true, title: 'Branch', value: 'develop' },
		{ short: true, title: 'Duration', value: '12 min' },
	],
};

const meta = {
	title: 'Components/Message/Content/Attachments',
	component: Attachments,
	decorators: [mockAppRoot().buildStoryDecorator()],
	parameters: { layout: 'padded' },
	args: { source },
} satisfies Meta<typeof Attachments>;

export default meta;

type Story = StoryObj<typeof meta>;

export const GenericFile: Story = {
	args: { attachments: [fileAttachment] },
};

export const EncryptedFile: Story = {
	args: { attachments: [{ ...fileAttachment, title_link: '/file-decrypt/report/quarterly-report.pdf' }] },
};

export const Image: Story = {
	args: { attachments: [imageAttachment] },
};

export const CollapsedImage: Story = {
	args: { attachments: [{ ...imageAttachment, collapsed: true }] },
};

export const Audio: Story = {
	args: { attachments: [audioAttachment] },
};

export const Video: Story = {
	args: { attachments: [videoAttachment] },
};

export const Quote: Story = {
	args: { attachments: [quoteAttachment] },
};

export const QuoteWithNestedFile: Story = {
	args: { attachments: [{ ...quoteAttachment, attachments: [fileAttachment] } as MessageQuoteAttachment] },
};

export const Default: Story = {
	args: { attachments: [defaultAttachment] },
};

export const DefaultWithActions: Story = {
	args: {
		attachments: [
			{
				...defaultAttachment,
				actions: [
					{ type: 'button', text: 'Open pipeline', url: 'https://example.com/pipelines/4521' },
					{ type: 'button', text: 'Retry', msg: '/retry 4521', msg_in_chat_window: true },
				],
			} as MessageAttachmentDefault,
		],
	},
};
