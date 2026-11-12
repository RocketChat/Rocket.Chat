import type { FC, ReactNode } from 'react';

import Message from './Message.js';
import MessageBlock from './MessageBlock.js';
import MessageBody from './MessageBody.js';
import MessageContainer from './MessageContainer.js';
import { MessageDivider } from './MessageDivider/index.js';
import MessageHeader from './MessageHeader.js';
import MessageLeftContainer from './MessageLeftContainer.js';
import MessageName from './MessageName.js';
import MessageNameContainer from './MessageNameContainer.js';
import MessageRole from './MessageRole.js';
import MessageRoles from './MessageRoles.js';
import MessageTimestamp from './MessageTimestamp.js';
import MessageUsername from './MessageUsername.js';
import { Avatar } from '../Avatar/index.js';
import { Box } from '../Box/index.js';

export const avatarUrl =
	'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z';

export const BasicMessageTemplate: FC<{
	reactions?: ReactNode;
	toolbar?: ReactNode;
	metrics?: ReactNode;
}> = ({ reactions, toolbar, metrics }) => (
	<Box>
		<MessageDivider>May, 24, 2020</MessageDivider>
		<Message tabIndex={0} className='customclass' clickable>
			<MessageLeftContainer>
				<Avatar alt='' url={avatarUrl} size='x36' />
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
				<MessageBody>Ut enim ad minim veniam</MessageBody>
				{reactions}
				{metrics && <MessageBlock>{metrics}</MessageBlock>}
			</MessageContainer>
			{toolbar}
		</Message>
	</Box>
);
