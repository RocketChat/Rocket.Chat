import Message from '.';
import sampleAudio from '../../../../.storybook/assets/sample-audio.mp3';
import sampleImage from '../../../../.storybook/assets/sample-image.jpg';
import sampleVideo from '../../../../.storybook/assets/sample-video.mp4';
import { attachmentResolver, avatarResolver, loremIpsum } from '../../../helpers.stories';
import {
	MESSAGE_TYPE_ROOM_NAME_CHANGED,
	MESSAGE_TYPE_USER_ADDED,
	MESSAGE_TYPE_USER_REMOVED,
	MESSAGE_TYPE_USER_JOINED,
	MESSAGE_TYPE_USER_LEFT,
	MESSAGE_TYPE_WELCOME,
	MESSAGE_TYPE_LIVECHAT_CLOSED,
	MESSAGE_TYPE_LIVECHAT_TRANSFER_HISTORY,
} from '../constants';

const messageTypes = {
	NULL: null,
	ROOM_NAME_CHANGED: MESSAGE_TYPE_ROOM_NAME_CHANGED,
	USER_ADDED: MESSAGE_TYPE_USER_ADDED,
	USER_REMOVED: MESSAGE_TYPE_USER_REMOVED,
	USER_JOINED: MESSAGE_TYPE_USER_JOINED,
	USER_LEFT: MESSAGE_TYPE_USER_LEFT,
	WELCOME: MESSAGE_TYPE_WELCOME,
	LIVECHAT_CLOSED: MESSAGE_TYPE_LIVECHAT_CLOSED,
	TRANSFER_HISTORY: MESSAGE_TYPE_LIVECHAT_TRANSFER_HISTORY,
};

const defaultMessage = loremIpsum({ count: 1, units: 'sentences' });
const defaultMessageExtra = loremIpsum({ count: 1, units: 'sentences' });

const defaultMarkdownMessage = `
# h1 Heading
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading

___

*This is bold text*

_This is italic text_

~Strikethrough~

+ Lorem ipsum dolor sit amet
+ Consectetur adipiscing elit
+ Integer molestie lorem at massa

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa

\`rocket.chat();\`

https://rocket.chat
`;

const defaultUser = {
	username: 'guilherme.gazzo',
	name: 'Guilherme Albrech Gazzo',
};

const now = new Date(Date.parse('2021-01-01T00:00:00.000Z'));

export default {
	title: 'Messages/Message',
	component: Message,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		me: { control: 'boolean' },
		compact: { control: 'boolean' },
		msg: { control: 'text' },
		t: { control: { type: 'select', options: messageTypes } },
		u: { control: 'object' },
		ts: { control: 'date' },
		attachments: { control: 'object' },
		blocks: { control: 'object' },
	},
	args: {
		me: false,
		compact: false,
		msg: defaultMessage,
		t: null,
		u: defaultUser,
		ts: now,
		attachments: [],
		blocks: [],
	},
};

export const Default = (args) => (
	<Message
		attachmentResolver={attachmentResolver}
		avatarResolver={avatarResolver}
		me={args.me}
		compact={args.compact}
		msg={args.msg}
		type={args.t}
		u={args.u}
		ts={args.ts}
		attachments={args.attachments}
		blocks={args.blocks}
	/>
);
Default.storyName = 'default';

export const System = (args) => (
	<Message
		attachmentResolver={attachmentResolver}
		avatarResolver={avatarResolver}
		me={args.me}
		compact={args.compact}
		msg={args.msg}
		type={args.t}
		u={args.u}
		ts={args.ts}
		attachments={args.attachments}
		blocks={args.blocks}
	/>
);
System.storyName = 'system';
System.args = {
	msg: '',
	t: MESSAGE_TYPE_WELCOME,
};

export const Me = (args) => (
	<Message
		attachmentResolver={attachmentResolver}
		avatarResolver={avatarResolver}
		me={args.me}
		compact={args.compact}
		msg={args.msg}
		type={args.t}
		u={args.u}
		ts={args.ts}
		attachments={args.attachments}
		blocks={args.blocks}
	/>
);
Me.storyName = 'me';
Me.args = {
	me: true,
};

export const Markdown = (args) => (
	<Message
		attachmentResolver={attachmentResolver}
		avatarResolver={avatarResolver}
		me={args.me}
		compact={args.compact}
		msg={args.msg}
		type={args.t}
		u={args.u}
		ts={args.ts}
		attachments={args.attachments}
		blocks={args.blocks}
	/>
);
Markdown.storyName = 'markdown';
Markdown.args = {
	msg: defaultMarkdownMessage,
};

export const Grouping = (args) => (
	<div>
		<Message
			attachmentResolver={attachmentResolver}
			avatarResolver={avatarResolver}
			me={args.me}
			compact={args.compact}
			msg={args.msg}
			type={args.t}
			u={args.u}
			ts={args.ts}
			attachments={args.attachments}
			blocks={args.blocks}
		/>
		<Message
			attachmentResolver={attachmentResolver}
			avatarResolver={avatarResolver}
			me={args.me}
			msg={defaultMessage}
			u={defaultUser}
			ts={now}
		/>
	</div>
);
Grouping.storyName = 'grouping';
Grouping.args = {
	msg: defaultMessageExtra,
	compact: true,
};

export const WithQuotation = (args) => (
	<Message
		attachmentResolver={attachmentResolver}
		avatarResolver={avatarResolver}
		me={args.me}
		compact={args.compact}
		msg={args.msg}
		type={args.t}
		u={args.u}
		ts={args.ts}
		attachments={args.attachments}
		blocks={args.blocks}
	/>
);
WithQuotation.storyName = 'with quotation';
WithQuotation.args = {
	attachments: [
		{
			message_link: 'http://localhost:3000/live/SqouQyJ7wDsK8KPnc?msg=EWrxmazqYbEf3rFzd',
			text: defaultMessageExtra,
		},
	],
};

export const WithAudioAttachment = (args) => (
	<Message
		attachmentResolver={attachmentResolver}
		avatarResolver={avatarResolver}
		me={args.me}
		compact={args.compact}
		msg={args.msg}
		type={args.t}
		u={args.u}
		ts={args.ts}
		attachments={args.attachments}
		blocks={args.blocks}
	/>
);
WithAudioAttachment.storyName = 'with audio attachment';
WithAudioAttachment.args = {
	attachments: [
		{
			audio_url: sampleAudio,
		},
	],
};

export const WithVideoAttachment = (args) => (
	<Message
		attachmentResolver={attachmentResolver}
		avatarResolver={avatarResolver}
		me={args.me}
		compact={args.compact}
		msg={args.msg}
		type={args.t}
		u={args.u}
		ts={args.ts}
		attachments={args.attachments}
		blocks={args.blocks}
	/>
);
WithVideoAttachment.storyName = 'with video attachment';
WithVideoAttachment.args = {
	attachments: [
		{
			video_url: sampleVideo,
		},
	],
};

export const WithImageAttachment = (args) => (
	<Message
		attachmentResolver={attachmentResolver}
		avatarResolver={avatarResolver}
		me={args.me}
		compact={args.compact}
		msg={args.msg}
		type={args.t}
		u={args.u}
		ts={args.ts}
		attachments={args.attachments}
		blocks={args.blocks}
	/>
);
WithImageAttachment.storyName = 'with image attachment';
WithImageAttachment.args = {
	attachments: [
		{
			image_url: sampleImage,
		},
	],
};

export const WithFilesAttachments = (args) => (
	<Message
		attachmentResolver={attachmentResolver}
		avatarResolver={avatarResolver}
		me={args.me}
		compact={args.compact}
		msg={args.msg}
		type={args.t}
		u={args.u}
		ts={args.ts}
		attachments={args.attachments}
		blocks={args.blocks}
	/>
);
WithFilesAttachments.storyName = 'with files attachments';
WithFilesAttachments.args = {
	attachments: ['pdf', 'doc', 'ppt', 'xls', 'zip', 'abc'].map((extension) => ({
		title_link: `http://example.com/demo.${extension}`,
		title: `Untitled ${extension} file`,
	})),
};

export const WithMultipleAttachments = (args) => (
	<Message
		attachmentResolver={attachmentResolver}
		avatarResolver={avatarResolver}
		me={args.me}
		compact={args.compact}
		msg={args.msg}
		type={args.t}
		u={args.u}
		ts={args.ts}
		attachments={args.attachments}
		blocks={args.blocks}
	/>
);
WithMultipleAttachments.storyName = 'with mutiple attachments';
WithMultipleAttachments.args = {
	attachments: [
		{
			audio_url: sampleAudio,
		},
		{
			video_url: sampleVideo,
		},
		{
			image_url: sampleImage,
		},
		{
			title_link: 'http://example.com/demo.pdf',
			title: 'Untitled pdf file',
		},
	],
};

export const WithUiKitBlocks = (args) => (
	<Message
		attachmentResolver={attachmentResolver}
		avatarResolver={avatarResolver}
		me={args.me}
		compact={args.compact}
		msg={args.msg}
		type={args.t}
		u={args.u}
		ts={args.ts}
		attachments={args.attachments}
		blocks={args.blocks}
	/>
);
WithUiKitBlocks.storyName = 'with UiKit blocks';
WithUiKitBlocks.args = {
	msg: '',
	blocks: [
		{
			type: 'section',
			text: {
				type: 'plain_text',
				text: 'This is a plain text section block.',
				emoji: true,
			},
		},
	],
};
