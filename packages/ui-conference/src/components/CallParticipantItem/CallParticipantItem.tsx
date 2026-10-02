import { Icon, Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemRow, ItemTitle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import type { CallParticipantControlsProps } from '../CallParticipantControls/CallParticipantControls';
import CallParticipantControls from '../CallParticipantControls/CallParticipantControls';
import CallParticipantStatus from '../CallParticipantStatus/CallParticipantStatus';

/** The row is named from the participant itself, which is the only name there is for one of these. */
type CallParticipantItemProps = Omit<CallParticipantControlsProps, 'name'>;

/**
 * Someone in the call the conference has never heard of: a guest who followed a link, a telephone dialled in,
 * anyone who arrived at the provider by an address rather than an invitation.
 *
 * There is no user behind the row — the protocol carries names and nothing else — so it shows the name the
 * provider gave and says plainly that it belongs to no one here. What can be done to them is the provider's
 * answer, the same as for anybody else in the call.
 */
const CallParticipantItem = (props: CallParticipantItemProps) => {
	const { participant } = props;
	const { t } = useTranslation();

	const name = participant.displayName || t('External_participant');

	return (
		<Item role='listitem' size='medium' inset='lg'>
			<ItemMedia>
				{/* No avatar to show, and a blank circle would read as one still loading. */}
				<Icon name='user-rounded' size='x20' color='hint' />
			</ItemMedia>
			<ItemContent>
				<ItemRow>
					<ItemTitle>{name}</ItemTitle>
					<CallParticipantStatus participant={participant} />
				</ItemRow>
				<ItemDescription>{t('External_participant')}</ItemDescription>
			</ItemContent>
			<ItemActions>
				<CallParticipantControls name={name} {...props} />
			</ItemActions>
		</Item>
	);
};

export default CallParticipantItem;
