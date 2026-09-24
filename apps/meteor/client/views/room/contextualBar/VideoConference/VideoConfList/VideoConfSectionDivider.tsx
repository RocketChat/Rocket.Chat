import { Box } from '@rocket.chat/fuselage';

type VideoConfSectionDividerProps = {
	title: string;
	count: number;
};

/** Names a run of calls in the history, and says how many are in it. */
export const VideoConfSectionDivider = ({ title, count }: VideoConfSectionDividerProps) => (
	<Box
		backgroundColor='room'
		height={36}
		fontScale='p2m'
		color='default'
		paddingBlock={8}
		paddingInline={24}
		display='flex'
		flexDirection='row'
		justifyContent='space-between'
		alignItems='center'
		borderBlockEndWidth='default'
		borderBlockEndColor='stroke-extra-light'
	>
		<Box>{title}</Box>
		<Box>{count}</Box>
	</Box>
);
