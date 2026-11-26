import { useTranslation } from 'react-i18next';

import type { PinToggleProps } from './PinToggle.js';
import PinToggle from './PinToggle.js';
import { useCallPins } from './context.js';
import type { ScreenShare } from './lib/screenShares.js';

export type ScreenPinProps = Pick<PinToggleProps, 'icon'> & {
	share: ScreenShare;
};

/** Pressed while the share is on the stage, whether the reader pinned it there or not. */
const ScreenPin = ({ share, icon }: ScreenPinProps) => {
	const { t } = useTranslation();
	const { screenOnStage, toggleScreenPin } = useCallPins();
	const { id } = share;

	const label = share.isLocal ? t('Pin_your_screen') : t('Pin_screen_of', { name: share.name });
	const unpinTitle = share.isLocal ? t('Unpin_your_screen') : t('Unpin_screen_of', { name: share.name });

	return (
		<PinToggle
			pinned={screenOnStage?.id === id}
			label={label}
			unpinTitle={unpinTitle}
			focusKey={`screen-${id}`}
			icon={icon}
			onToggle={() => toggleScreenPin(id)}
		/>
	);
};

export default ScreenPin;
