import { Box, Tag } from '@rocket.chat/fuselage';

const ReactionUserTag = ({ displayName }: { displayName: string }) => (
	<Box mie={4} mbe={4}>
		<Tag variant='primary'>{displayName}</Tag>
	</Box>
);

export default ReactionUserTag;
