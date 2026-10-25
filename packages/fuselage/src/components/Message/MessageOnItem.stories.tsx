import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { ReactNode } from 'react';

import { Avatar } from '../Avatar';
import Message, { type MessageProps } from './Message';
import MessageBlock from './MessageBlock';
import MessageBody from './MessageBody';
import MessageContainer from './MessageContainer';
import MessageHeader from './MessageHeader';
import MessageLeftContainer from './MessageLeftContainer';
import {
	MessageMetrics,
	MessageMetricsFollowing,
	MessageMetricsItem,
	MessageMetricsItemIcon,
	MessageMetricsItemLabel,
	MessageMetricsReply,
} from './MessageMetrics';
import MessageName from './MessageName';
import MessageNameContainer from './MessageNameContainer';
import MessageReactions, { MessageReaction, MessageReactionAction } from './MessageReactions';
import MessageRole from './MessageRole';
import MessageRoles from './MessageRoles';
import { MessageStatusIndicator, MessageStatusIndicatorItem } from './MessageStatusIndicator';
import MessageTimestamp from './MessageTimestamp';
import { MessageToolbar, MessageToolbarItem, MessageToolbarWrapper } from './MessageToolbar';
import MessageUsername from './MessageUsername';
import { avatarUrl } from './helpers';

export default {
	title: 'Message/Message on Item',
	component: Message,
	parameters: {
		docs: {
			description: {
				component:
					'`Message` rendered on the `Item` primitives: the left container is `ItemMedia`, the container is `ItemContent` and the header is an `ItemRow`.',
			},
		},
	},
} satisfies Meta<typeof Message>;

type Story = StoryObj<typeof Message>;

const shortText = 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua';

const longText =
	'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat a duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat a duis aute irure dolor in reprehenderit.';

const toolbar = (visible?: boolean) => (
	<MessageToolbarWrapper visible={visible}>
		<MessageToolbar>
			<MessageToolbarItem icon='quote' />
			<MessageToolbarItem icon='clock' />
			<MessageToolbarItem icon='thread' />
		</MessageToolbar>
	</MessageToolbarWrapper>
);

const Row = ({
	body = shortText,
	extra,
	toolbarVisible,
	...props
}: MessageProps & { body?: ReactNode; extra?: ReactNode; toolbarVisible?: boolean }) => (
	<Message {...props}>
		<MessageLeftContainer>
			<Avatar url={avatarUrl} size='x36' />
		</MessageLeftContainer>
		<MessageContainer>
			<MessageHeader>
				<MessageNameContainer>
					<MessageName>Haylie George</MessageName> <MessageUsername>@haylie.george</MessageUsername>
				</MessageNameContainer>
				<MessageRoles>
					<MessageRole>Admin</MessageRole>
				</MessageRoles>
				<MessageTimestamp>12:00 PM</MessageTimestamp>
			</MessageHeader>
			<MessageBody>{body}</MessageBody>
			{extra}
		</MessageContainer>
		{toolbar(toolbarVisible)}
	</Message>
);

const SequentialRow = ({ body = shortText, ...props }: MessageProps & { body?: ReactNode }) => (
	<Message sequential {...props}>
		<MessageLeftContainer />
		<MessageContainer>
			<MessageBody>{body}</MessageBody>
		</MessageContainer>
		{toolbar()}
	</Message>
);

const withPadding = (node: ReactNode) => <div style={{ paddingBlockStart: 32 }}>{node}</div>;

export const Default: Story = {
	render: () => withPadding(<Row />),
};

export const Sequential: Story = {
	render: () =>
		withPadding(
			<>
				<Row />
				<SequentialRow />
				<SequentialRow body='A second follow-up from the same author' />
			</>,
		),
};

export const Selected: Story = {
	render: () => withPadding(<Row isSelected />),
};

export const Editing: Story = {
	render: () => withPadding(<Row isEditing />),
};

export const Pending: Story = {
	render: () => withPadding(<Row isPending />),
};

export const Highlight: Story = {
	render: () => withPadding(<Row highlight />),
};

export const Clickable: Story = {
	render: () => withPadding(<Row clickable tabIndex={0} />),
};

export const ToolbarVisible: Story = {
	render: () => withPadding(<Row toolbarVisible />),
};

export const LongBody: Story = {
	render: () => (
		<div style={{ maxWidth: 480 }}>
			{withPadding(<Row body={longText} />)}
			<SequentialRow body={longText} />
		</div>
	),
};

export const ReactionsAndMetrics: Story = {
	render: () =>
		withPadding(
			<Row
				extra={
					<>
						<MessageReactions>
							<MessageReaction mine counter={1} />
							<MessageReaction counter={2} />
							<MessageReactionAction />
						</MessageReactions>
						<MessageBlock>
							<MessageMetrics>
								<MessageMetricsReply>Reply</MessageMetricsReply>
								<MessageMetricsItem>
									<MessageMetricsItemIcon name='thread' />
									<MessageMetricsItemLabel>1</MessageMetricsItemLabel>
								</MessageMetricsItem>
								<MessageMetricsItem>
									<MessageMetricsItemIcon name='clock' />
									<MessageMetricsItemLabel>12:30 PM</MessageMetricsItemLabel>
								</MessageMetricsItem>
								<MessageMetricsFollowing name='bell' />
							</MessageMetrics>
						</MessageBlock>
					</>
				}
			/>,
		),
};

export const MissingAvatarWithStatusIndicators: Story = {
	render: () =>
		withPadding(
			<>
				<Row />
				<Message sequential>
					<MessageLeftContainer>
						<MessageStatusIndicator>
							<MessageStatusIndicatorItem name='star-filled' />
							<MessageStatusIndicatorItem name='star-filled' data-title='starred' />
						</MessageStatusIndicator>
					</MessageLeftContainer>
					<MessageContainer>
						<MessageBody>{shortText}</MessageBody>
					</MessageContainer>
				</Message>
			</>,
		),
};

export const RTL: Story = {
	render: () => (
		<div dir='rtl'>
			{withPadding(<Row />)}
			<SequentialRow />
		</div>
	),
};
