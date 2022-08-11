import { MessageDivider, Message, Avatar, Box, Button } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import type { ReactElement } from 'react';

import '@rocket.chat/icons/dist/rocketchat.css';
import { VideoConfMessage, VideoConfMessageIcon, VideoConfMessageRow, VideoConfMessageText } from '.';

export default {
	title: 'Components/VideoConfMessage',
	component: VideoConfMessage,
	decorators: [
		(Story): ReactElement => (
			<Box>
				<MessageDivider>May, 24, 2020</MessageDivider>
				<Message className='customclass'>
					<Message.LeftContainer>
						<Avatar url={avatarUrl} size={'x36'} />
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
} as ComponentMeta<typeof VideoConfMessage>;

const avatarUrl =
	'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z';

export const CallingDM: ComponentStory<typeof VideoConfMessage> = () => (
	<VideoConfMessage>
		<VideoConfMessageRow>
			<VideoConfMessageIcon name='phone-in' backgroundColor='primary-200' color='primary-600' />
			<VideoConfMessageText fontScale='c2'>Calling...</VideoConfMessageText>
		</VideoConfMessageRow>
		<VideoConfMessageRow backgroundColor='neutral-100'>
			<Button small primary>
				Join
			</Button>
			<VideoConfMessageText>Waiting for answer</VideoConfMessageText>
		</VideoConfMessageRow>
	</VideoConfMessage>
);

export const CallEndedDM: ComponentStory<typeof VideoConfMessage> = () => (
	<VideoConfMessage>
		<VideoConfMessageRow>
			<VideoConfMessageIcon name='phone-off' backgroundColor='neutral-400' color='neutral-700' />
			<VideoConfMessageText fontScale='c2'>Call ended</VideoConfMessageText>
		</VideoConfMessageRow>
		<VideoConfMessageRow backgroundColor='neutral-100'>
			<Button small secondary>
				Call back
			</Button>
			<VideoConfMessageText>Call was not answered</VideoConfMessageText>
		</VideoConfMessageRow>
	</VideoConfMessage>
);

export const CallOngoing: ComponentStory<typeof VideoConfMessage> = () => (
	<VideoConfMessage>
		<VideoConfMessageRow>
			<VideoConfMessageIcon name='phone' backgroundColor='success-200' color='success-800' />
			<VideoConfMessageText fontScale='c2'>Call ongoing</VideoConfMessageText>
		</VideoConfMessageRow>
		<VideoConfMessageRow backgroundColor='neutral-100'>
			<Button small primary>
				Join
			</Button>
			<Box display='flex' alignItems='center' mis='x8'>
				{Array(3)
					.fill('')
					.map((_, index) => (
						<Box mie='x4'>
							<Avatar key={index} size='x28' url={avatarUrl} />
						</Box>
					))}
				<Box fontScale='c1' mis='x4'>
					Joined
				</Box>
			</Box>
		</VideoConfMessageRow>
	</VideoConfMessage>
);

export const CallEnded: ComponentStory<typeof VideoConfMessage> = () => (
	<VideoConfMessage>
		<VideoConfMessageRow>
			<VideoConfMessageIcon name='phone-off' backgroundColor='neutral-400' color='neutral-700' />
			<VideoConfMessageText fontScale='c2'>Call ended</VideoConfMessageText>
		</VideoConfMessageRow>
		<VideoConfMessageRow backgroundColor='neutral-100'>
			<Box display='flex' alignItems='center' mis='x8'>
				{Array(3)
					.fill('')
					.map((_, index) => (
						<Box mie='x4'>
							<Avatar key={index} size='x28' url={avatarUrl} />
						</Box>
					))}
				<Box fontScale='c1' mis='x4'>
					Joined
				</Box>
			</Box>
		</VideoConfMessageRow>
	</VideoConfMessage>
);
