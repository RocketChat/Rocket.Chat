import { getUserDisplayNames } from '@rocket.chat/core-typings';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemRow, ItemTitle, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useConferenceViewer } from '../../context/ConferenceContext';
import type { ConferenceMember } from '../../context/definitions';
import type { CallParticipantControlsProps } from '../CallParticipantControls/CallParticipantControls';
import CallParticipantControls from '../CallParticipantControls/CallParticipantControls';
import CallParticipantStatus from '../CallParticipantStatus/CallParticipantStatus';

type CallParticipantItemProps = Omit<CallParticipantControlsProps, 'name'> & {
	/** The member this is another connection of. Absent for someone the conference has never heard of. */
	member?: ConferenceMember;
};

/**
 * A connection to the call that is not a member's row of its own.
 *
 * Usually someone the conference has never heard of: a guest who followed a link, a telephone dialled in,
 * anyone who arrived at the provider by an address rather than an invitation. There is no user behind that row,
 * so it shows the name the provider gave and says plainly that it belongs to no one here. Otherwise it is a
 * member connected from more than one place, named after them and sitting under their row. What can be done to
 * either is the provider's answer, the same as for anybody else in the call.
 */
const CallParticipantItem = ({ member, ...props }: CallParticipantItemProps) => {
	const { participant } = props;
	const { t } = useTranslation();
	const { useRealName } = useConferenceViewer();

	const [memberName] = member ? getUserDisplayNames(member.name, member.username, useRealName) : [];
	const name = memberName || participant.displayName || t('External_participant');

	return (
		<Item role='listitem' inset='lg'>
			<ItemMedia>
				{/* No avatar to show, and a blank circle would read as one still loading. */}
				<Icon name='user-rounded' size='x20' color='hint' />
			</ItemMedia>
			<ItemContent>
				<ItemRow>
					<ItemTitle>{name}</ItemTitle>
					<CallParticipantStatus participant={participant} />
				</ItemRow>
				<ItemDescription>
					{[participant.isHost && t('Host'), t(member ? 'Another_connection' : 'External_participant')].filter(Boolean).join(' · ')}
				</ItemDescription>
			</ItemContent>
			<ItemActions>
				<CallParticipantControls name={name} {...props} />
			</ItemActions>
		</Item>
	);
};

export default CallParticipantItem;
