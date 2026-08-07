import { Option, OptionAvatar, OptionContent } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserDisplayName } from '@rocket.chat/ui-client';

import type { ConferenceMember } from './hooks/useConferenceEmbedded';

/** A conference member, named from the conference's own record — there may be no shared room to look them up in. */
const ConferenceMemberRow = ({ member }: { member: Pick<ConferenceMember, '_id' | 'username' | 'name'> }) => {
	const displayName = useUserDisplayName(member);

	return (
		<Option>
			<OptionAvatar>
				<UserAvatar username={member.username} size='x24' />
			</OptionAvatar>
			<OptionContent>{displayName}</OptionContent>
		</Option>
	);
};

export default ConferenceMemberRow;
