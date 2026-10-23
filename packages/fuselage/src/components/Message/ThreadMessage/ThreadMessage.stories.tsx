import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ThreadMessage from './ThreadMessage';
import ThreadMessageBody from './ThreadMessageBody';
import ThreadMessageContainer from './ThreadMessageContainer';
import ThreadMessageEmoji from './ThreadMessageEmoji';
import ThreadMessageIconThread from './ThreadMessageIconThread';
import ThreadMessageLeftContainer from './ThreadMessageLeftContainer';
import ThreadMessageOrigin from './ThreadMessageOrigin';
import ThreadMessageRow from './ThreadMessageRow';
import ThreadMessageUnfollow from './ThreadMessageUnfollow';
import { Avatar } from '../../Avatar';
import { Box } from '../../Box';

export default {
	title: 'Message/ThreadMessage',
	component: ThreadMessage,
	argTypes: {
		children: {
			control: false,
			description: 'Thread message content, composed from ThreadMessage subcomponents (row, container, body, origin, etc).',
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
			description: 'Compact styling for a message that follows another from the same author.',
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
			description: 'Called when the thread message is activated.',
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof ThreadMessage>;

type Story = StoryObj<typeof ThreadMessage>;

const avatarUrl =
	'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z';

export const Default: Story = {
	render: () => (
		<Box>
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

export const WithEmoji: Story = {
	render: () => (
		<Box>
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
							Thread Emoji test: <ThreadMessageEmoji name='test' image={`url(${avatarUrl})`} />{' '}
							<ThreadMessageEmoji name='grinning'>😀</ThreadMessageEmoji>
						</ThreadMessageBody>
					</ThreadMessageContainer>
				</ThreadMessageRow>
			</ThreadMessage>
		</Box>
	),
};

export const WithSystemMessage: Story = {
	render: () => (
		<Box>
			<ThreadMessage>
				<ThreadMessageRow>
					<ThreadMessageLeftContainer>
						<ThreadMessageIconThread />
					</ThreadMessageLeftContainer>
					<ThreadMessageContainer>
						<ThreadMessageOrigin system>system message</ThreadMessageOrigin>
						<ThreadMessageUnfollow />
					</ThreadMessageContainer>
				</ThreadMessageRow>
				<ThreadMessageRow>
					<ThreadMessageLeftContainer>
						<Avatar url={avatarUrl} size='x16' />
					</ThreadMessageLeftContainer>
					<ThreadMessageContainer>
						<ThreadMessageBody>
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
