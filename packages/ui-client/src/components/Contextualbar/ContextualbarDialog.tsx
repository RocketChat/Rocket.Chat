import type { AriaDialogProps } from '@react-aria/dialog';
import { useDialog } from '@react-aria/dialog';
import { FocusScope } from '@react-aria/focus';
import { Contextualbar, type ContextualbarProps } from '@rocket.chat/fuselage';
import { useLayoutSizes, useLayoutContextualBarPosition, useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useCallback, useRef } from 'react';

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
	const closeContextualbar = onClose ?? closeTab;

	const callbackRef = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			ref.current = node;
			node.addEventListener('keydown', (e: KeyboardEvent) => {
				if (e.key === 'Escape') {
					closeContextualbar();
				}
			});
		},
		[closeContextualbar],
	);

	return (
		<FocusScope autoFocus restoreFocus>
			<ContextualbarResizable defaultWidth={contextualBar}>
				<Contextualbar ref={callbackRef} width='100%' position={position} {...dialogProps} {...props} />
			</ContextualbarResizable>
		</FocusScope>
	);
};

export default ContextualbarDialog;
