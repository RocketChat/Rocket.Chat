import { Stack, Tag } from '@rocket.chat/fuselage';

export type CannedResponseTagListProps = {
	'tags': string[];
	'aria-labelledby'?: string;
};

/**
 * A canned response's tags, wrapping onto more lines when they don't fit.
 */
const CannedResponseTagList = ({ tags, 'aria-labelledby': labelledBy }: CannedResponseTagListProps) => (
	<Stack is='ul' direction='row' wrap gap='x4' aria-labelledby={labelledBy}>
		{tags.map((tag) => (
			<li key={tag}>
				<Tag>{tag}</Tag>
			</li>
		))}
	</Stack>
);

export default CannedResponseTagList;
