import type { AriaDialogProps } from '@react-aria/dialog';
import { useDialog } from '@react-aria/dialog';
import { FocusScope } from '@react-aria/focus';
import { useOverlay } from '@react-aria/overlays';
import { Contextualbar, type ContextualbarProps } from '@rocket.chat/fuselage';
import { useLayoutSizes, useLayoutContextualBarPosition, useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useRef } from 'react';

import ContextualbarResizable from './ContextualbarResizable';

export type ContextualbarDialogProps = AriaDialogProps & ContextualbarProps & { onClose?: () => void };

/**
 * @prop onClose can be used to close contextualbar outside the room context with ESC key
 * */
const ContextualbarDialog = ({ onClose, ...props }: ContextualbarDialogProps) => {
	const ref = useRef<HTMLElement | null>(null);
	const { dialogProps } = useDialog({ 'aria-labelledby': 'contextualbarTitle', ...props }, ref);
	const { contextualBar } = useLayoutSizes();
	const position = useLayoutContextualBarPosition();
	const { closeTab } = useRoomToolbox();
	const { overlayProps } = useOverlay({ isOpen: true, onClose: onClose ?? closeTab }, ref);

	return (
		<FocusScope autoFocus restoreFocus>
			<ContextualbarResizable defaultWidth={contextualBar}>
				<Contextualbar ref={ref} stretch position={position} {...overlayProps} {...dialogProps} {...props} />
			</ContextualbarResizable>
		</FocusScope>
	);
};

export default ContextualbarDialog;
