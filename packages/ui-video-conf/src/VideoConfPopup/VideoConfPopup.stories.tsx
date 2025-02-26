import { Avatar, Icon } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';
import type { ReactElement } from 'react';

import VideoConfButton from '../VideoConfButton';
import VideoConfController from '../VideoConfController';
import VideoConfPopup from './VideoConfPopup';
import VideoConfPopupBackdrop from './VideoConfPopupBackdrop';
import VideoConfPopupContent from './VideoConfPopupContent';
import VideoConfPopupControllers from './VideoConfPopupControllers';
import VideoConfPopupFooter from './VideoConfPopupFooter';
import VideoConfPopupFooterButtons from './VideoConfPopupFooterButtons';
import VideoConfPopupHeader from './VideoConfPopupHeader';
import VideoConfPopupInfo from './VideoConfPopupInfo';
import VideoConfPopupTitle from './VideoConfPopupTitle';

export default {
	title: 'Components/VideoConfPopup',
	component: VideoConfPopup,
	decorators: [
		(Story): ReactElement => (
			<VideoConfPopupBackdrop>
				<Story />
			</VideoConfPopupBackdrop>
		),
	],
} satisfies Meta<typeof VideoConfPopup>;

const avatarUrl =
	'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z';

export const StartCall: StoryFn<typeof VideoConfPopup> = () => (
	<VideoConfPopup aria-label='Start Call'>
		<VideoConfPopupHeader>
			<VideoConfPopupTitle text='Start Call' />
			<VideoConfPopupControllers>
				<VideoConfController active={false} aria-label='video' icon='video' onClick={action('click')} />
				<VideoConfController active={true} aria-label='mic' icon='mic' onClick={action('click')} />
			</VideoConfPopupControllers>
		</VideoConfPopupHeader>
		<VideoConfPopupContent>
			<VideoConfPopupInfo avatar={<Avatar alt='' url={avatarUrl} />} icon={<Icon name='hash' />}>
				Room Name
			</VideoConfPopupInfo>
		</VideoConfPopupContent>
		<VideoConfPopupFooter>
			<VideoConfPopupFooterButtons>
				<VideoConfButton primary onClick={action('click')}>
					Start Call
				</VideoConfButton>
			</VideoConfPopupFooterButtons>
		</VideoConfPopupFooter>
	</VideoConfPopup>
);
