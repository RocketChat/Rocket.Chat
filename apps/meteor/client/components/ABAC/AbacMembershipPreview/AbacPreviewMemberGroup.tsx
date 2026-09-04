import type { AbacPreviewMember } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';

import AbacPreviewMemberRow from './AbacPreviewMemberRow';

export type AbacPreviewMemberGroupProps = {
	title: string;
	/** Total in this group across the whole target, not just the page rendered below. */
	count: number;
	members: AbacPreviewMember[];
};

/** A titled, counted group of members in the membership-impact preview. */
const AbacPreviewMemberGroup = ({ title, count, members }: AbacPreviewMemberGroupProps) => (
	<Box marginBlockEnd={12}>
		<Box display='flex' justifyContent='space-between' alignItems='center' paddingBlockEnd={4} marginBlockEnd={4}>
			<Box fontScale='c1' color='hint'>
				{title}
			</Box>
			<Box fontScale='c1' color='hint' style={{ fontVariantNumeric: 'tabular-nums' }}>
				{count}
			</Box>
		</Box>
		{members.map((member) => (
			<AbacPreviewMemberRow key={member._id} member={member} />
		))}
	</Box>
);

export default AbacPreviewMemberGroup;
