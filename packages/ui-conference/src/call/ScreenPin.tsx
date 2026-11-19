import { useTranslation } from 'react-i18next';

import type { PinToggleProps } from './PinToggle';
import PinToggle from './PinToggle';
import { useCallPins } from './context';
import type { ScreenShare } from './lib/screenShares';

export type ScreenPinProps = Pick<PinToggleProps, 'icon'> & {
	share: Pick<ScreenShare, 'id' | 'name' | 'isLocal'>;
};

/** Pressed while the share is on the stage, whether the reader pinned it there or not. */
const ScreenPin = ({ share: { id, name, isLocal }, icon }: ScreenPinProps) => {
	const { t } = useTranslation();
	const { screenOnStage, toggleScreenPin } = useCallPins();
	const pinned = screenOnStage?.id === id;

	const label =
		isLocal || !name ? t(pinned ? 'Unpin_your_screen' : 'Pin_your_screen') : t(pinned ? 'Unpin_screen_of' : 'Pin_screen_of', { name });

	return <PinToggle pinned={pinned} label={label} focusKey={`screen-${id}`} icon={icon} onToggle={() => toggleScreenPin(id)} />;
};

export default ScreenPin;
