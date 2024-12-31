import { Box } from '@rocket.chat/fuselage';

const CounterItem = ({
	title = '',
	count = '-',
	...props
}: {
	title: string | JSX.Element;
	count: string | number;
	flexShrink?: number;
	pb?: number;
	flexBasis?: string;
}) => (
	<Box display='flex' flexDirection='column' justifyContent='space-between' alignItems='center' flexGrow={1} {...props}>
		<Box fontScale='h4' textTransform='uppercase' color='hint' textAlign='center' pi={8}>
			{title}
		</Box>
		<Box fontScale='h2'>{count}</Box>
	</Box>
);

export default CounterItem;
