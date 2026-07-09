import { Box, Tag } from '@rocket.chat/fuselage';

export type ReactionUserTagProps = { displayName: string };

const ReactionUserTag = ({ displayName }: ReactionUserTagProps) => (
	<Box mie={4} mbe={4}>
		<Tag variant='primary'>{displayName}</Tag>
	</Box>
);

export default ReactionUserTag;
