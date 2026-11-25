import { useTranslation } from 'react-i18next';

import PinToggle from './PinToggle.js';
import { useCallPins } from './context.js';

export type ParticipantPinProps = {
	participantId: string;
	name: string;
};

const ParticipantPin = ({ participantId, name }: ParticipantPinProps) => {
	const { t } = useTranslation();
	const { pinnedId, togglePin } = useCallPins();

	return (
		<PinToggle
			pinned={pinnedId === participantId}
			label={t('Pin_participant', { name })}
			unpinTitle={t('Unpin_participant', { name })}
			focusKey={`person-${participantId}`}
			onToggle={() => togglePin(participantId)}
		/>
	);
};

export default ParticipantPin;
