import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserDisplayName } from '@rocket.chat/ui-client';

import type { ConferenceMember } from './hooks/useConferenceEmbedded';

/** A conference member, named from the conference's own record — there may be no shared room to look them up in. */
const ConferenceMemberRow = ({ member }: { member: Pick<ConferenceMember, '_id' | 'username' | 'name'> }) => {
	const displayName = useUserDisplayName(member);

	return (
		<Box display='flex' alignItems='center' marginBlockStart={8}>
			<UserAvatar username={member.username} size='x24' />
			<Box marginInlineStart={8} fontScale='p2m' color='default' withTruncatedText>
				{displayName}
			</Box>
		</Box>
	);
};

export default ConferenceMemberRow;
