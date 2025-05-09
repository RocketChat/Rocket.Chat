import { MessageDivider, Message, Avatar, Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';
import type { ReactElement } from 'react';

import { VideoConfMessage, VideoConfMessageIcon, VideoConfMessageRow, VideoConfMessageText } from '.';
import VideoConfMessageAction from './VideoConfMessageAction';
import VideoConfMessageActions from './VideoConfMessageActions';
import VideoConfMessageButton from './VideoConfMessageButton';
import VideoConfMessageContent from './VideoConfMessageContent';
import VideoConfMessageFooter from './VideoConfMessageFooter';
import VideoConfMessageFooterText from './VideoConfMessageFooterText';
import VideoConfMessageSkeleton from './VideoConfMessageSkeleton';
import VideoConfMessageUserStack from './VideoConfMessageUserStack';

export default {
	title: 'Components/VideoConfMessage',
	component: VideoConfMessage,
	decorators: [
		(Story): ReactElement => (
			<Box>
				<MessageDivider>May, 24, 2020</MessageDivider>
				<Message className='customclass'>
					<Message.LeftContainer>
						<Avatar alt='' url={avatarUrl} size='x36' />
					</Message.LeftContainer>
					<Message.Container>
						<Message.Header>
							<Message.Name>Haylie George</Message.Name>
							<Message.Username>@haylie.george</Message.Username>
							<Message.Role>Admin</Message.Role>
							<Message.Role>User</Message.Role>
							<Message.Role>Owner</Message.Role>
							<Message.Timestamp>12:00 PM</Message.Timestamp>
						</Message.Header>
						<Message.Body>
							<Story />
						</Message.Body>
					</Message.Container>
				</Message>
			</Box>
		),
	],
} satisfies Meta<typeof VideoConfMessage>;

const avatarUrl =
	'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z';

const fakeUsers = Array.from({ length: 10 }).map((_, i) => ({
	username: `user${i}`,
	ts: new Date().toISOString(),
	name: `User ${i}`,
	_id: `id${i}`,
	avatarETag: '',
}));

export const CallingDM: StoryFn<typeof VideoConfMessage> = () => (
	<VideoConfMessage>
		<VideoConfMessageRow>
			<VideoConfMessageContent>
				<VideoConfMessageIcon variant='incoming' />
				<VideoConfMessageText>Calling...</VideoConfMessageText>
			</VideoConfMessageContent>
			<VideoConfMessageActions>
				<VideoConfMessageAction aria-label='info' icon='info' />
			</VideoConfMessageActions>
		</VideoConfMessageRow>
		<VideoConfMessageFooter>
			<VideoConfMessageButton primary>Join</VideoConfMessageButton>
			<VideoConfMessageFooterText>Waiting for answer</VideoConfMessageFooterText>
		</VideoConfMessageFooter>
	</VideoConfMessage>
);

export const CallEndedDM: StoryFn<typeof VideoConfMessage> = () => (
	<VideoConfMessage>
		<VideoConfMessageRow>
			<VideoConfMessageContent>
				<VideoConfMessageIcon />
				<VideoConfMessageText>Call ended</VideoConfMessageText>
			</VideoConfMessageContent>
			<VideoConfMessageActions>
				<VideoConfMessageAction aria-label='info' icon='info' />
			</VideoConfMessageActions>
		</VideoConfMessageRow>
		<VideoConfMessageFooter>
			<VideoConfMessageButton>Call Back</VideoConfMessageButton>
			<VideoConfMessageFooterText>Call was not answered</VideoConfMessageFooterText>
		</VideoConfMessageFooter>
	</VideoConfMessage>
);

export const CallOngoing: StoryFn<typeof VideoConfMessage> = () => (
	<VideoConfMessage>
		<VideoConfMessageRow>
			<VideoConfMessageContent>
				<VideoConfMessageIcon variant='outgoing' />
				<VideoConfMessageText>Call ongoing</VideoConfMessageText>
			</VideoConfMessageContent>
			<VideoConfMessageActions>
				<VideoConfMessageAction aria-label='info' icon='info' />
			</VideoConfMessageActions>
		</VideoConfMessageRow>
		<VideoConfMessageFooter>
			<VideoConfMessageButton primary>Join</VideoConfMessageButton>
			<VideoConfMessageUserStack users={fakeUsers} />
			<VideoConfMessageFooterText>joined</VideoConfMessageFooterText>
		</VideoConfMessageFooter>
	</VideoConfMessage>
);

export const CallEnded: StoryFn<typeof VideoConfMessage> = () => (
	<VideoConfMessage>
		<VideoConfMessageRow>
			<VideoConfMessageContent>
				<VideoConfMessageIcon />
				<VideoConfMessageText>Call ended</VideoConfMessageText>
			</VideoConfMessageContent>
			<VideoConfMessageActions>
				<VideoConfMessageAction aria-label='info' icon='info' />
			</VideoConfMessageActions>
		</VideoConfMessageRow>
		<VideoConfMessageFooter>
			<VideoConfMessageUserStack users={fakeUsers} />
			<VideoConfMessageFooterText>joined</VideoConfMessageFooterText>
		</VideoConfMessageFooter>
	</VideoConfMessage>
);

export const Loading: StoryFn<typeof VideoConfMessage> = () => <VideoConfMessageSkeleton />;

export const NoAvatars: StoryFn<typeof VideoConfMessage> = () => (
	<VideoConfMessage>
		<VideoConfMessageRow>
			<VideoConfMessageContent>
				<VideoConfMessageIcon variant='outgoing' />
				<VideoConfMessageText>Call ongoing</VideoConfMessageText>
			</VideoConfMessageContent>
			<VideoConfMessageActions>
				<VideoConfMessageAction aria-label='info' icon='info' />
			</VideoConfMessageActions>
		</VideoConfMessageRow>
		<VideoConfMessageFooter>
			<VideoConfMessageButton primary>Join</VideoConfMessageButton>
			<VideoConfMessageUserStack users={fakeUsers} />
			<VideoConfMessageFooterText>{fakeUsers.length} joined</VideoConfMessageFooterText>
		</VideoConfMessageFooter>
	</VideoConfMessage>
);
