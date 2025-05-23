import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import { useLayoutSizes, useLayoutContextualBarPosition } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useCallback, useRef } from 'react';
import type { AriaDialogProps } from 'react-aria';
import { FocusScope, useDialog } from 'react-aria';

import Contextualbar from './Contextualbar';
import ContextualbarResizable from './ContextualbarResizable';
import { useRoomToolbox } from '../../views/room/contexts/RoomToolboxContext';

type ContextualbarDialogProps = AriaDialogProps & ComponentProps<typeof Contextualbar> & { onClose?: () => void };

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
			<FeaturePreview feature='contextualbarResizable'>
				<FeaturePreviewOn>
					<ContextualbarResizable defaultWidth={contextualBar}>
						<Contextualbar ref={callbackRef} width='100%' position={position} {...dialogProps} {...props} />
					</ContextualbarResizable>
				</FeaturePreviewOn>
				<FeaturePreviewOff>
					<Contextualbar ref={callbackRef} width={contextualBar} position={position} {...dialogProps} {...props} />
				</FeaturePreviewOff>
			</FeaturePreview>
		</FocusScope>
	);
};

export default ContextualbarDialog;
