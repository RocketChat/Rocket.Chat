import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { useState } from 'react';

import { Avatar } from '../Avatar';
import { Box } from '../Box';
import Message from './Message';
import MessageBlock from './MessageBlock';
import MessageBody from './MessageBody';
import MessageContainer from './MessageContainer';
import { MessageDivider } from './MessageDivider';
import MessageEmoji from './MessageEmoji';
import MessageHeader from './MessageHeader';
import MessageHighlight from './MessageHighlight';
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
import MessageReactions, { MessageReaction, MessageReactionAction, MessageReactionCounter, MessageReactionEmoji } from './MessageReactions';
import MessageRole from './MessageRole';
import MessageRoles from './MessageRoles';
import MessageTimestamp from './MessageTimestamp';
import { MessageToolbar, MessageToolbarItem, MessageToolbarWrapper } from './MessageToolbar';
import MessageUsername from './MessageUsername';
import {
	ThreadMessage,
	ThreadMessageBody,
	ThreadMessageContainer,
	ThreadMessageEmoji,
	ThreadMessageIconThread,
	ThreadMessageLeftContainer,
	ThreadMessageOrigin,
	ThreadMessageRow,
	ThreadMessageUnfollow,
} from './ThreadMessage';
import { avatarUrl } from './helpers';

export default {
	title: 'Message/Message',
	component: Message,
	parameters: {
		docs: {
			description: {
				component:
					'The main unit of information: text plus sender info and interaction elements. Rich text with attachments, threads and reactions.\n\n' +
					'**Rules**\n' +
					'- Use the system-message style for one-liner system operations; use the default style for human/bot messages.\n' +
					'- Bot messages carry special UI Kit content in a separate block.',
			},
		},
	},
	argTypes: {
		children: {
			control: false,
			description: 'Message content, composed from Message subcomponents (header, body, reactions, toolbar, etc).',
			table: { category: 'Content' },
		},
		className: {
			control: 'text',
			description: 'Additional CSS class applied to the root element.',
			table: { category: 'Content' },
		},
		clickable: {
			control: 'boolean',
			description: 'Shows a pointer cursor and hover styling; also implied by passing an `onClick` handler.',
			table: { category: 'Behavior' },
		},
		sequential: {
			control: 'boolean',
			description: 'Compact styling for a message that follows another from the same author, hiding the repeated header.',
			table: { category: 'Behavior' },
		},
		isSelected: {
			control: 'boolean',
			description: 'Applies the selected visual state.',
			table: { category: 'State' },
		},
		isEditing: {
			control: 'boolean',
			description: 'Applies the editing visual state.',
			table: { category: 'State' },
		},
		isPending: {
			control: 'boolean',
			description: 'Applies the pending (not yet sent) visual state.',
			table: { category: 'State' },
		},
		highlight: {
			control: 'boolean',
			description: 'Applies the highlighted visual state.',
			table: { category: 'State' },
		},
		onClick: {
			control: false,
			description: 'Called when the message is activated.',
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof Message>;

type Story = StoryObj<typeof Message>;

export const Default: Story = {
	render: () => (
		<Box>
			<MessageDivider>May, 24, 2020</MessageDivider>
			<Message className='customclass' clickable>
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
							<MessageRole>User</MessageRole>
							<MessageRole>Owner</MessageRole>
						</MessageRoles>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBody>
						Ut enim ad minim veniam,{' '}
						<MessageHighlight clickable variant='link'>
							channel
						</MessageHighlight>{' '}
						quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat a duis aute irure dolor in{' '}
						<MessageHighlight clickable variant='critical'>
							Haylie George
						</MessageHighlight>{' '}
						commodo consequat a duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
						Consectetur adipiscing commodo consequat a duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
						fugiat nulla pariatur. Consectetur adipiscing <MessageHighlight variant='critical'>highlighted word</MessageHighlight> touching
						text.{' '}
						<MessageHighlight clickable variant='relevant'>
							all
						</MessageHighlight>{' '}
						<MessageHighlight clickable variant='relevant'>
							here
						</MessageHighlight>
						. elit, sed do eiusmod tempor incididunt{' '}
						<MessageHighlight clickable variant='link'>
							Room Name
						</MessageHighlight>{' '}
						ut labore et dolore magna{' '}
						<MessageHighlight clickable variant='other'>
							Gabriel.Henriques
						</MessageHighlight>
						. aliqua. Ut enim ad minim veniam...
					</MessageBody>
					<MessageReactions>
						<MessageReaction mine counter={1} />
						<MessageReaction counter={2} />
						<MessageReaction counter={3} />
						<MessageReactionAction />
					</MessageReactions>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
		</Box>
	),
};

export const WithMentions: Story = {
	parameters: {
		docs: {
			description: {
				story:
					'The same message with its mentions rendered without and with the ' +
					'`@`/`#` symbols, which is what the mention symbol setting toggles. ' +
					'Mentions are plain text in a distinct color, so they read as part ' +
					'of the sentence instead of interrupting it.',
			},
		},
	},
	render: () => (
		<Box>
			<Message>
				<MessageLeftContainer>
					<Avatar url={avatarUrl} size='x36' />
				</MessageLeftContainer>
				<MessageContainer>
					<MessageHeader>
						<MessageNameContainer>
							<MessageName>Haylie George</MessageName> <MessageUsername>@haylie.george</MessageUsername>
						</MessageNameContainer>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBody>
						<MessageHighlight clickable variant='other'>
							gabriel.henriques
						</MessageHighlight>
						, I moved the release checklist to{' '}
						<MessageHighlight clickable variant='link'>
							release-planning
						</MessageHighlight>{' '}
						—{' '}
						<MessageHighlight clickable variant='relevant'>
							here
						</MessageHighlight>{' '}
						please review it before the handoff to{' '}
						<MessageHighlight clickable variant='critical'>
							haylie.george
						</MessageHighlight>
						.
					</MessageBody>
				</MessageContainer>
			</Message>
			<Message>
				<MessageLeftContainer>
					<Avatar url={avatarUrl} size='x36' />
				</MessageLeftContainer>
				<MessageContainer>
					<MessageHeader>
						<MessageNameContainer>
							<MessageName>Haylie George</MessageName> <MessageUsername>@haylie.george</MessageUsername>
						</MessageNameContainer>
						<MessageTimestamp>12:01 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBody>
						<MessageHighlight clickable variant='other'>
							@gabriel.henriques
						</MessageHighlight>
						, I moved the release checklist to{' '}
						<MessageHighlight clickable variant='link'>
							#release-planning
						</MessageHighlight>{' '}
						—{' '}
						<MessageHighlight clickable variant='relevant'>
							@here
						</MessageHighlight>{' '}
						please review it before the handoff to{' '}
						<MessageHighlight clickable variant='critical'>
							@haylie.george
						</MessageHighlight>
						.
					</MessageBody>
				</MessageContainer>
			</Message>
		</Box>
	),
};

export const WithClickableAuthorName: Story = {
	render: () => (
		<Box>
			<Message>
				<MessageLeftContainer>
					<Avatar url={avatarUrl} size='x36' />
				</MessageLeftContainer>
				<MessageContainer>
					<MessageHeader>
						<MessageNameContainer role='button' tabIndex={0}>
							<MessageName>Haylie George</MessageName>
						</MessageNameContainer>
						<MessageRoles>
							<MessageRole>Admin</MessageRole>
						</MessageRoles>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBody>The author name underlines on hover when its container acts as a button.</MessageBody>
				</MessageContainer>
			</Message>
		</Box>
	),
};

export const WithSequential: Story = {
	render: () => (
		<Box>
			<MessageDivider>May, 24, 2020</MessageDivider>
			<Message className='customclass' clickable>
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
							<MessageRole>User</MessageRole>
							<MessageRole>Owner</MessageRole>
						</MessageRoles>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBody>
						Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat a duis aute irure
						dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Consectetur adipiscing elit, sed do
						eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...
					</MessageBody>
					<MessageReactions>
						<MessageReaction counter={1} />
						<MessageReaction counter={2} />
						<MessageReaction counter={3} />
						<MessageReactionAction />
					</MessageReactions>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
			<Message className='customclass' clickable sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
			<Message className='customclass' clickable sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
				</MessageContainer>
			</Message>
			<Message className='customclass' clickable sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
			<Message className='customclass' clickable sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>
						{'Test Message Emoji ->'} <MessageEmoji name='test' image={`url(${avatarUrl})`} />{' '}
						<MessageEmoji name='grinning'>😀</MessageEmoji>
					</MessageBody>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
			<Message className='customclass' clickable sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>
						<MessageEmoji big name='test' image={`url(${avatarUrl})`} />{' '}
						<MessageEmoji big name='rocket'>
							🚀
						</MessageEmoji>
					</MessageBody>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
		</Box>
	),
};

export const WithEmojis: Story = {
	parameters: {
		docs: {
			description: {
				story:
					'Every place an emoji can show up in a message. The message body takes its ' +
					'line height from the `--rcx-message-body-line-height` token (22px) and inline ' +
					'emojis (`MessageEmoji`) are sized from the same token, so a line holding an ' +
					'emoji is exactly as tall as one without, whether the emoji is unicode or ' +
					'custom (image), at the start, middle or end of a line, or in a row. A message ' +
					'made only of emojis renders them `big`. Thread previews use ' +
					'`ThreadMessageEmoji` and reactions use `MessageReactionEmoji`, each sized to ' +
					'its own container.',
			},
		},
	},
	render: () => (
		<Box>
			<MessageDivider>May, 24, 2020</MessageDivider>
			<Message className='customclass' clickable>
				<MessageLeftContainer>
					<Avatar url={avatarUrl} size='x36' />
				</MessageLeftContainer>
				<MessageContainer>
					<MessageHeader>
						<MessageNameContainer>
							<MessageName>Haylie George</MessageName> <MessageUsername>@haylie.george</MessageUsername>
						</MessageNameContainer>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBody>
						Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat a duis aute irure
						dolor in reprehenderit <MessageEmoji name='pink_heart'>🩷</MessageEmoji> in voluptate velit esse cillum dolore eu fugiat nulla
						pariatur. Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
						veniam...
					</MessageBody>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
			<Message className='customclass' clickable sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>
						Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat a duis aute irure
						dolor in reprehenderit <MessageEmoji name='custom' image={`url(${avatarUrl})`} /> in voluptate velit esse cillum dolore eu
						fugiat nulla pariatur. Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
						ad minim veniam...
					</MessageBody>
				</MessageContainer>
			</Message>
			<Message className='customclass' clickable sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>
						<MessageEmoji name='wave'>👋</MessageEmoji> Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua{' '}
						<MessageEmoji name='rocket'>🚀</MessageEmoji>
					</MessageBody>
				</MessageContainer>
			</Message>
			<Message className='customclass' clickable sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>
						Sed do eiusmod tempor <MessageEmoji name='grinning'>😀</MessageEmoji>
						<MessageEmoji name='joy'>😂</MessageEmoji>
						<MessageEmoji name='heart_eyes'>😍</MessageEmoji>
						<MessageEmoji name='custom' image={`url(${avatarUrl})`} />
						<MessageEmoji name='fire'>🔥</MessageEmoji> incididunt ut labore et dolore magna aliqua
					</MessageBody>
				</MessageContainer>
			</Message>
			<Message className='customclass' clickable sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>
						Sed do eiusmod tempor incididunt ut labore et <MessageHighlight>dolore</MessageHighlight>{' '}
						<MessageEmoji name='tada'>🎉</MessageEmoji> magna aliqua
					</MessageBody>
				</MessageContainer>
			</Message>
			<Message className='customclass' clickable sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>
						<MessageEmoji big name='rocket'>
							🚀
						</MessageEmoji>{' '}
						<MessageEmoji big name='custom' image={`url(${avatarUrl})`} />{' '}
						<MessageEmoji big name='tada'>
							🎉
						</MessageEmoji>
					</MessageBody>
					<MessageReactions>
						<MessageReaction title='grinning' mine>
							<MessageReactionEmoji name='grinning'>😀</MessageReactionEmoji>
							<MessageReactionCounter counter={5} />
						</MessageReaction>
						<MessageReaction title='custom'>
							<MessageReactionEmoji name='custom' image={`url(${avatarUrl})`} />
							<MessageReactionCounter counter={2} />
						</MessageReaction>
						<MessageReactionAction />
					</MessageReactions>
				</MessageContainer>
			</Message>
			<ThreadMessage>
				<ThreadMessageRow>
					<ThreadMessageLeftContainer>
						<ThreadMessageIconThread />
					</ThreadMessageLeftContainer>
					<ThreadMessageContainer>
						<ThreadMessageOrigin>
							Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat...
						</ThreadMessageOrigin>
						<ThreadMessageUnfollow />
					</ThreadMessageContainer>
				</ThreadMessageRow>
				<ThreadMessageRow>
					<ThreadMessageLeftContainer>
						<Avatar url={avatarUrl} size='x16' />
					</ThreadMessageLeftContainer>
					<ThreadMessageContainer>
						<ThreadMessageBody>
							Ut enim ad minim veniam <ThreadMessageEmoji name='grinning'>😀</ThreadMessageEmoji> quis nostrud exercitation{' '}
							<ThreadMessageEmoji image={`url(${avatarUrl})`} name='custom' /> ullamco laboris nisi ut aliquip ex ea commodo consequat...
						</ThreadMessageBody>
					</ThreadMessageContainer>
				</ThreadMessageRow>
			</ThreadMessage>
		</Box>
	),
};

export const MessageWithThread: Story = {
	render: () => (
		<Box>
			<MessageDivider unreadLabel='Unread'>May, 24, 2020</MessageDivider>
			<Message className='customclass' clickable>
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
							<MessageRole>User</MessageRole>
							<MessageRole>Owner</MessageRole>
						</MessageRoles>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBody>
						Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat a duis aute irure
						dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Consectetur adipiscing elit, sed do
						eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...
					</MessageBody>
					<MessageReactions>
						<MessageReaction counter={1} />
						<MessageReaction counter={2} />
						<MessageReaction counter={3} />
						<MessageReactionAction />
					</MessageReactions>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
			<Message className='customclass' clickable sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
			<Message className='customclass' clickable sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
				</MessageContainer>
			</Message>
			<Message className='customclass' clickable sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
			<ThreadMessage>
				<ThreadMessageRow>
					<ThreadMessageLeftContainer>
						<ThreadMessageIconThread />
					</ThreadMessageLeftContainer>
					<ThreadMessageContainer>
						<ThreadMessageOrigin>
							Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat a duis aute irure
							dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Consectetur adipiscing elit, sed do
							eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...
						</ThreadMessageOrigin>
						<ThreadMessageUnfollow />
					</ThreadMessageContainer>
				</ThreadMessageRow>
				<ThreadMessageRow>
					<ThreadMessageLeftContainer>
						<Avatar url={avatarUrl} size='x16' />
					</ThreadMessageLeftContainer>
					<ThreadMessageContainer>
						<ThreadMessageBody>
							<ThreadMessageEmoji image={`url(${avatarUrl})`} name='test' />
							<ThreadMessageEmoji name='grinning'>😀</ThreadMessageEmoji>
							Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat a duis aute irure
							dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Consectetur adipiscing elit, sed do
							eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...
						</ThreadMessageBody>
					</ThreadMessageContainer>
				</ThreadMessageRow>
			</ThreadMessage>
		</Box>
	),
};

export const MessageSelected: Story = {
	render: () => {
		const [selected, setSelected] = useState(true);
		return (
			<Box>
				<MessageDivider>May, 24, 2020</MessageDivider>
				<Message className='customclass' onClick={() => setSelected(!selected)} isSelected={selected}>
					<MessageLeftContainer>
						<Avatar
							url='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC
                  4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMj
                  IyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAA
                  AAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAg
                  MREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6L
                  xqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVr
                  jbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRk
                  eX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef
                  6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkB
                  SuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlP
                  UH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z'
							size='x36'
						/>
					</MessageLeftContainer>
					<MessageContainer>
						<MessageHeader>
							<MessageNameContainer>
								<MessageName>Haylie George</MessageName> <MessageUsername>@haylie.george</MessageUsername>
							</MessageNameContainer>
							<MessageRoles>
								<MessageRole>Admin</MessageRole>
								<MessageRole>User</MessageRole>
								<MessageRole>Owner</MessageRole>
							</MessageRoles>
							<MessageTimestamp>12:00 PM</MessageTimestamp>
						</MessageHeader>
						<MessageBody>
							Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat a duis aute irure
							dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Consectetur adipiscing elit, sed do
							eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...
						</MessageBody>
						<MessageReactions>
							<MessageReaction counter={1} />
							<MessageReaction counter={2} />
							<MessageReaction counter={3} />
							<MessageReactionAction />
						</MessageReactions>
					</MessageContainer>
				</Message>
			</Box>
		);
	},
};

export const MessageEditing: Story = {
	render: () => (
		<Box>
			<MessageDivider>May, 24, 2020</MessageDivider>
			<Message className='customclass' clickable>
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
							<MessageRole>User</MessageRole>
							<MessageRole>Owner</MessageRole>
						</MessageRoles>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBody>
						Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat a duis aute irure
						dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Consectetur adipiscing elit, sed do
						eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...
					</MessageBody>
					<MessageReactions>
						<MessageReaction counter={1} />
						<MessageReaction counter={2} />
						<MessageReaction counter={3} />
						<MessageReactionAction />
					</MessageReactions>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
			<Message className='customclass' clickable sequential isEditing>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
			<Message className='customclass' clickable sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
				</MessageContainer>
			</Message>
			<Message className='customclass' clickable sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
		</Box>
	),
};

export const MessageUnorderedList: Story = {
	render: () => (
		<Box>
			<MessageDivider>May, 24, 2020</MessageDivider>
			<Message className='customclass' clickable>
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
							<MessageRole>User</MessageRole>
							<MessageRole>Owner</MessageRole>
						</MessageRoles>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBody>
						Unordered list:
						<ul>
							<li>Ut enim ad minim</li>
							<li>Incididunt ut labore</li>
							<li>Labore et dolore</li>
						</ul>
					</MessageBody>
					<MessageReactions>
						<MessageReaction counter={1} />
						<MessageReaction counter={2} />
						<MessageReaction counter={3} />
						<MessageReactionAction />
					</MessageReactions>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
		</Box>
	),
};

export const MessageOrderedList: Story = {
	render: () => (
		<Box>
			<MessageDivider>May, 24, 2020</MessageDivider>
			<Message className='customclass' clickable>
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
							<MessageRole>User</MessageRole>
							<MessageRole>Owner</MessageRole>
						</MessageRoles>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBody>
						Ordered list:
						<ol>
							<li value={1}>Ut enim ad minim</li>
							<li value={2}>Incididunt ut labore</li>
							<li value={6}>Labore et dolore</li>
						</ol>
					</MessageBody>
					<MessageReactions>
						<MessageReaction counter={1} />
						<MessageReaction counter={2} />
						<MessageReaction counter={3} />
						<MessageReactionAction />
					</MessageReactions>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
		</Box>
	),
};

export const MessageHighlighted: Story = {
	render: () => (
		<Box>
			<MessageDivider>May, 24, 2020</MessageDivider>
			<Message className='customclass' highlight>
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
							<MessageRole>User</MessageRole>
							<MessageRole>Owner</MessageRole>
						</MessageRoles>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBody>
						Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat a duis aute irure
						dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Consectetur adipiscing elit, sed do
						eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...
					</MessageBody>
					<MessageReactions>
						<MessageReaction counter={1} />
						<MessageReaction counter={2} />
						<MessageReaction counter={3} />
						<MessageReactionAction />
					</MessageReactions>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
			<Message className='customclass' sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
			<Message className='customclass' sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
				</MessageContainer>
			</Message>
			<Message className='customclass' sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
		</Box>
	),
};

export const MessagePending: Story = {
	render: () => (
		<Box>
			<MessageDivider>May, 24, 2020</MessageDivider>
			<Message className='customclass' isPending>
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
							<MessageRole>User</MessageRole>
							<MessageRole>Owner</MessageRole>
						</MessageRoles>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBody>
						Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat a duis aute irure
						dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Consectetur adipiscing elit, sed do
						eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...
					</MessageBody>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
			<Message className='customclass' isPending sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
			<Message className='customclass' isPending sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
				</MessageContainer>
			</Message>
			<Message className='customclass' isPending sequential>
				<MessageLeftContainer />
				<MessageContainer>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
		</Box>
	),
};

export const MessageWithMetrics: Story = {
	render: () => (
		<Box>
			<MessageDivider>May, 24, 2020</MessageDivider>
			<Message className='customclass'>
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
							<MessageRole>User</MessageRole>
							<MessageRole>Owner</MessageRole>
						</MessageRoles>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBody>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</MessageBody>
					<MessageBlock>
						<MessageMetrics>
							<MessageMetricsReply>Reply</MessageMetricsReply>
							<MessageMetricsItem>
								<MessageMetricsItemIcon name='thread' />
								<MessageMetricsItemLabel>1</MessageMetricsItemLabel>
							</MessageMetricsItem>
							<MessageMetricsItem>
								<MessageMetricsItemIcon name='user' />
								<MessageMetricsItemLabel>2</MessageMetricsItemLabel>
							</MessageMetricsItem>
							<MessageMetricsItem>
								<MessageMetricsItemIcon name='clock' />
								<MessageMetricsItemLabel>12:30 PM</MessageMetricsItemLabel>
							</MessageMetricsItem>
							<MessageMetricsFollowing name='bell' />
						</MessageMetrics>
					</MessageBlock>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
		</Box>
	),
};

export const MessageWithHeadings: Story = {
	render: () => (
		<Box>
			<MessageDivider>May, 24, 2020</MessageDivider>
			<Message className='customclass' clickable>
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
							<MessageRole>User</MessageRole>
							<MessageRole>Owner</MessageRole>
						</MessageRoles>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBody>
						<h1 style={{ marginTop: 0 }}>Heading 1</h1>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
						enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
						in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
						sunt in culpa qui officia deserunt mollit anim id est laborum.
						<h2>Heading 2</h2>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
						<h3>Heading 3</h3>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
						<h4>Heading 4</h4>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					</MessageBody>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
		</Box>
	),
};

export const LotsOfReactions: Story = {
	render: () => (
		<Box>
			<MessageDivider>May, 24, 2020</MessageDivider>
			<Message className='customclass' clickable>
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
							<MessageRole>User</MessageRole>
							<MessageRole>Owner</MessageRole>
						</MessageRoles>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBody>
						Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat a duis aute irure
						dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Consectetur adipiscing elit, sed do
						eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...
					</MessageBody>
					<MessageReactions>
						{Array.from({ length: 100 }).map((_, index) => (
							<MessageReaction key={index} counter={index} mine={!(index % 3)} />
						))}
						<MessageReactionAction />
					</MessageReactions>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
		</Box>
	),
};

export const BlockAfterHeader: Story = {
	render: () => (
		<Box>
			<MessageDivider>May, 24, 2020</MessageDivider>
			<Message className='customclass' clickable>
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
							<MessageRole>User</MessageRole>
							<MessageRole>Owner</MessageRole>
						</MessageRoles>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
					</MessageHeader>
					<MessageBlock>
						<Box
							width='full'
							backgroundColor='status-background-success'
							height='200px'
							border='1px solid'
							borderColor='stroke-extra-light'
							borderRadius='medium'
						/>
					</MessageBlock>
				</MessageContainer>
				<MessageToolbarWrapper>
					<MessageToolbar>
						<MessageToolbarItem icon='quote' />
						<MessageToolbarItem icon='clock' />
						<MessageToolbarItem icon='thread' />
					</MessageToolbar>
				</MessageToolbarWrapper>
			</Message>
		</Box>
	),
};
