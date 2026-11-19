import { useTranslation } from 'react-i18next';

import PinToggle from './PinToggle';
import { useCallPins } from './context';

export type ParticipantPinProps = {
	participantId: string;
	name: string;
};

const ParticipantPin = ({ participantId, name }: ParticipantPinProps) => {
	const { t } = useTranslation();
	const { pinnedId, togglePin } = useCallPins();
	const pinned = pinnedId === participantId;

	return (
		<PinToggle
			pinned={pinned}
			label={t(pinned ? 'Unpin_participant' : 'Pin_participant', { name })}
			focusKey={`person-${participantId}`}
			onToggle={() => togglePin(participantId)}
		/>
	);
};

export default ParticipantPin;
