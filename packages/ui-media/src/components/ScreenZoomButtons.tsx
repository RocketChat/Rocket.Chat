import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import ActionButton from './ActionButton.js';

export type ScreenZoomButtonsProps = {
	canZoomIn: boolean;
	canZoomOut: boolean;
	onZoomIn: () => void;
	onZoomOut: () => void;
};

const ScreenZoomButtons = ({ canZoomIn, canZoomOut, onZoomIn, onZoomOut }: ScreenZoomButtonsProps) => {
	const { t } = useTranslation();
	const zoomOutRef = useRef<HTMLButtonElement>(null);
	const zoomInRef = useRef<HTMLButtonElement>(null);

	// A button disabled while it has focus strands the keyboard there, so focus goes to the one still usable.
	useLayoutEffect(() => {
		const { current: zoomOut } = zoomOutRef;
		const { current: zoomIn } = zoomInRef;
		const focused = zoomIn?.ownerDocument.activeElement;

		if (!canZoomIn && focused === zoomIn) {
			zoomOut?.focus();
		}
		if (!canZoomOut && focused === zoomOut) {
			zoomIn?.focus();
		}
	}, [canZoomIn, canZoomOut]);

	return (
		<>
			<ActionButton ref={zoomOutRef} icon='h-bar' label={t('Zoom_out')} disabled={!canZoomOut} onClick={onZoomOut} />
			<ActionButton ref={zoomInRef} icon='plus' label={t('Zoom_in')} disabled={!canZoomIn} onClick={onZoomIn} />
		</>
	);
};

export default ScreenZoomButtons;
