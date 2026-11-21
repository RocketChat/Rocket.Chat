import { useTranslation } from 'react-i18next';

import ActionButton from './ActionButton';
import type { ActionButtonProps } from './ActionButton';
import type { ScreenZoom } from '../streams/screenZoom';
import { MAX_ZOOM_SCALE, UNZOOMED } from '../streams/screenZoom';

export type ScreenZoomButtonsProps = {
	zoom: ScreenZoom;
	onZoomIn: () => void;
	onZoomOut: () => void;
	size?: ActionButtonProps['size'];
};

/** Zoom out and zoom in, for a group of controls over a shared screen; each stops once the screen goes no further. */
const ScreenZoomButtons = ({ zoom, onZoomIn, onZoomOut, size }: ScreenZoomButtonsProps) => {
	const { t } = useTranslation();

	return (
		<>
			<ActionButton size={size} icon='h-bar' label={t('Zoom_out')} disabled={zoom.scale <= UNZOOMED.scale} onClick={onZoomOut} />
			<ActionButton size={size} icon='plus' label={t('Zoom_in')} disabled={zoom.scale >= MAX_ZOOM_SCALE} onClick={onZoomIn} />
		</>
	);
};

export default ScreenZoomButtons;
