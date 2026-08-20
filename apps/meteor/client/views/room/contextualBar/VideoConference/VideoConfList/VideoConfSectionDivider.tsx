import { Box } from '@rocket.chat/fuselage';

type VideoConfSectionDividerProps = {
	title: string;
	count: number;
};

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
		borderBlockEndWidth={1}
		borderBlockEndColor='extra-light'
	>
		<Box>{title}</Box>
		<Box>{count}</Box>
	</Box>
);
