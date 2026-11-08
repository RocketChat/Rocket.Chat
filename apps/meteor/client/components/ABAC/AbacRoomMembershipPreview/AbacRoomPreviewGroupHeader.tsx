import { Box } from '@rocket.chat/fuselage';

type AbacRoomPreviewGroupHeaderProps = {
	title: string;
};

const AbacRoomPreviewGroupHeader = ({ title }: AbacRoomPreviewGroupHeaderProps) => (
	<Box
		flexShrink={0}
		backgroundColor='room'
		height={36}
		fontScale='p2m'
		color='default'
		paddingBlock={8}
		paddingInline={24}
		display='flex'
		borderBlockEndWidth='default'
		borderBlockEndColor='extra-light'
	>
		{title}
	</Box>
);

export default AbacRoomPreviewGroupHeader;
