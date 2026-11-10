import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { action } from 'storybook/actions';

import { Avatar } from '../../Avatar';
import { Badge } from '../../Badge';
import { BasicMessageTemplate } from '../helpers';
import MessageMetrics from './MessageMetrics';
import MessageMetricsFollowing from './MessageMetricsFollowing';
import {
	MessageMetricsItem,
	MessageMetricsItemAvatarRow,
	MessageMetricsItemAvatarRowContent,
	MessageMetricsItemIcon,
	MessageMetricsItemLabel,
} from './MessageMetricsItem';
import MessageMetricsReply from './MessageMetricsReply';

const imgUrl =
	'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z';

export default {
	title: 'Message/MessageMetrics',
	component: MessageMetrics,
	subcomponents: {
		MessageMetricsReply,
		MessageMetricsItem,
		MessageMetricsFollowing,
		MessageMetricsItemIcon,
		MessageMetricsItemLabel,
		MessageMetricsItemAvatarRowContent,
		MessageMetricsItemAvatarRow,
	},
	argTypes: {
		children: {
			control: false,
			description: 'Metrics row content, composed from MessageMetrics subcomponents (reply, item, following).',
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof MessageMetrics>;

type Story = StoryObj<typeof MessageMetrics>;

const metrics = (
	<MessageMetrics>
		<MessageMetricsReply>Reply</MessageMetricsReply>
		<MessageMetricsItem title='Replies'>
			<MessageMetricsItemIcon name='thread' />
			<MessageMetricsItemLabel>10</MessageMetricsItemLabel>
		</MessageMetricsItem>
		<MessageMetricsItem>
			<MessageMetricsFollowing title='Following' name='bell' onClick={action('click')} />
		</MessageMetricsItem>
	</MessageMetrics>
);

const metricsThread = (
	<MessageMetrics>
		<MessageMetricsReply onClick={action('click view thread')}>View thread</MessageMetricsReply>
		<MessageMetricsItem>
			<MessageMetricsFollowing
				title='Following'
				name='bell'
				onClick={action('click follow thread')}
				badge={<Badge small variant='danger' />}
			/>
		</MessageMetricsItem>
		<MessageMetricsItem title='Participants'>
			<MessageMetricsItemAvatarRow>
				<MessageMetricsItemAvatarRowContent>
					<Avatar alt='gazzolia' size='x16' url={imgUrl} />
				</MessageMetricsItemAvatarRowContent>
				<MessageMetricsItemAvatarRowContent>
					<Avatar alt='gazzolia' size='x16' url={imgUrl} />
				</MessageMetricsItemAvatarRowContent>
			</MessageMetricsItemAvatarRow>
			<MessageMetricsItemLabel>+ 3 followers</MessageMetricsItemLabel>
		</MessageMetricsItem>
		<MessageMetricsItem title='Last message: 12th July, 2024'>
			<MessageMetricsItemIcon name='thread' />
			<MessageMetricsItemLabel>5 messages, 12th July, 2024</MessageMetricsItemLabel>
		</MessageMetricsItem>
	</MessageMetrics>
);

export const Default: Story = {
	render: () => <BasicMessageTemplate metrics={metrics} />,
};

export const ThreadMetrics: Story = {
	render: () => <BasicMessageTemplate metrics={metricsThread} />,
};
