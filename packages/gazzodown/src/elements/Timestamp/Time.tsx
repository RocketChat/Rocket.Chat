import { Tag } from '@rocket.chat/fuselage';

export type TimeProps = {
	value: string;
	dateTime: string;
};

const Time = ({ value, dateTime }: TimeProps) => (
	<time
		title={new Date(dateTime).toLocaleString()}
		dateTime={dateTime}
		style={{
			display: 'inline-block',
		}}
	>
		<Tag>{value}</Tag>
	</time>
);

export default Time;
