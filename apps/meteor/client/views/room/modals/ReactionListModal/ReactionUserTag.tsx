import { Box, Tag } from '@rocket.chat/fuselage';

export type ReactionUserTagProps = { displayName: string };

const ReactionUserTag = ({ displayName }: ReactionUserTagProps) => (
	<Box marginInlineEnd={4} marginBlockEnd={4}>
		<Tag variant='primary'>{displayName}</Tag>
	</Box>
);

export default ReactionUserTag;
