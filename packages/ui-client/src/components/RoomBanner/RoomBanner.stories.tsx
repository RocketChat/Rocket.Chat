import { Avatar, Box, IconButton } from '@rocket.chat/fuselage';
import { ComponentProps } from 'react';

import { RoomBanner } from './RoomBanner';
import { RoomBannerContent } from './RoomBannerContent';

export default {
	title: 'Components/RoomBanner',
	component: RoomBanner,
};
const avatarUrl =
	'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z';

const CustomAvatar = (props: Omit<ComponentProps<typeof Avatar>, 'url'>) => <Avatar size='x28' url={avatarUrl} {...props} />;

export const Default = () => (
	<RoomBanner>
		<RoomBannerContent>
			Plain text long long long loooooooooooooong loooong loooong loooong loooong loooong loooong teeeeeeext
		</RoomBannerContent>
		<Box display='flex' mis='x24' flexShrink={0} alignItems='center'>
			<CustomAvatar size='x18' />
			<Box fontScale='p2' color='secondary-info' mi='x4'>
				Will Bell
			</Box>
			<IconButton icon='message' small />
		</Box>
	</RoomBanner>
);

export const WithoutTopic = () => (
	<RoomBanner>
		<RoomBannerContent>
			<Box is='a' href='#'>
				Add topic
			</Box>
		</RoomBannerContent>
		<Box display='flex' mis='x24' flexShrink={0} alignItems='center'>
			<CustomAvatar size='x18' />
			<Box fontScale='p2' color='secondary-info' mi='x4'>
				Will Bell
			</Box>
			<IconButton icon='message' small />
		</Box>
	</RoomBanner>
);

export const TopicAndAnnouncement = () => (
	<div>
		<RoomBanner>
			<RoomBannerContent>
				Topic long long long loooooooooooooong loooong loooong loooong loooong loooong loooong loooong loooong teeeeeeext
			</RoomBannerContent>
			<Box display='flex' mis='x24' flexShrink={0} alignItems='center'>
				<CustomAvatar size='x18' />
				<Box fontScale='p2' color='secondary-info' mi='x4'>
					Will Bell
				</Box>
				<IconButton icon='message' small />
			</Box>
		</RoomBanner>
		<RoomBanner>
			<RoomBannerContent>
				Announcement banner <a href='google.com'>google.com</a>
			</RoomBannerContent>
		</RoomBanner>
	</div>
);
