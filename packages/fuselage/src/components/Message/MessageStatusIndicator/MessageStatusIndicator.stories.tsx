import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../../Avatar';
import { Box } from '../../Box';
import Message from '../Message';
import MessageBody from '../MessageBody';
import MessageContainer from '../MessageContainer';
import { MessageDivider } from '../MessageDivider';
import MessageHeader from '../MessageHeader';
import MessageLeftContainer from '../MessageLeftContainer';
import MessageName from '../MessageName';
import MessageNameContainer from '../MessageNameContainer';
import MessageReactions, { MessageReaction, MessageReactionAction } from '../MessageReactions';
import MessageRole from '../MessageRole';
import MessageTimestamp from '../MessageTimestamp';
import { MessageToolbar, MessageToolbarItem, MessageToolbarWrapper } from '../MessageToolbar';
import MessageUsername from '../MessageUsername';
import MessageStatusIndicator from './MessageStatusIndicator';
import MessageStatusIndicatorItem from './MessageStatusIndicatorItem';
import MessageStatusIndicatorText from './MessageStatusIndicatorText';

export default {
	title: 'Message/MessageStatusIndicator',
	component: MessageStatusIndicator,
	subcomponents: {
		MessageStatusIndicatorItem,
		MessageStatusIndicatorText,
	},
	argTypes: {
		children: {
			control: false,
			description: 'Status items content, composed from MessageStatusIndicatorItem/MessageStatusIndicatorText subcomponents.',
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof MessageStatusIndicator>;

type Story = StoryObj<typeof MessageStatusIndicator>;

export const Default: Story = {
	render: () => (
		<Box>
			<MessageDivider>May, 24, 2020</MessageDivider>
			<Message clickable>
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
						<MessageRole>Admin</MessageRole>
						<MessageRole>User</MessageRole>
						<MessageRole>Owner</MessageRole>
						<MessageTimestamp>12:00 PM</MessageTimestamp>
						<MessageStatusIndicator>
							<MessageStatusIndicatorItem name='star' variant='success' />
							<MessageStatusIndicatorItem name='star' variant='danger' />
							<MessageStatusIndicatorItem name='star' variant='warning' />
							<MessageStatusIndicatorItem name='star' variant='primary' />
							<MessageStatusIndicatorItem name='star-filled' data-title='starred' />
						</MessageStatusIndicator>
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
				<MessageLeftContainer>
					<MessageStatusIndicator>
						<MessageStatusIndicatorItem name='star-filled' />
						<MessageStatusIndicatorItem name='star-filled' />
						<MessageStatusIndicatorItem name='star-filled' />
						<MessageStatusIndicatorItem name='star-filled' />
						<MessageStatusIndicatorItem name='star-filled' data-title='starred' />
					</MessageStatusIndicator>
				</MessageLeftContainer>
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
				<MessageLeftContainer>
					<MessageStatusIndicator>
						<MessageStatusIndicatorText>
							<MessageStatusIndicatorItem name='star-filled' /> Status
						</MessageStatusIndicatorText>
					</MessageStatusIndicator>
				</MessageLeftContainer>
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
