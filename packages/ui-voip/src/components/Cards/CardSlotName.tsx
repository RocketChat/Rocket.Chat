import { Box } from '@rocket.chat/fuselage';

type CardSlotNameProps = {
	displayName: string;
};

const CardSlotName = ({ displayName }: CardSlotNameProps) => {
	return (
		<Box fontScale='c2' color='default' mi={4}>
			{displayName}
		</Box>
	);
};

export default CardSlotName;
