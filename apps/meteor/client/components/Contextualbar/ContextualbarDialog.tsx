import { Contextualbar } from '@rocket.chat/fuselage';
import { useLayoutSizes, useLayoutContextualBarPosition } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { useRef } from 'react';
import type { AriaDialogProps } from 'react-aria';
import { FocusScope, useDialog } from 'react-aria';

type ContextualbarDialogProps = AriaDialogProps & ComponentProps<typeof Contextualbar>;

const ContextualbarDialog = (props: ContextualbarDialogProps) => {
	const ref = useRef(null);
	const { dialogProps } = useDialog({ 'aria-labelledby': 'contextualbarTitle', ...props }, ref);
	const sizes = useLayoutSizes();
	const position = useLayoutContextualBarPosition();

	return (
		<FocusScope autoFocus restoreFocus>
			<Contextualbar ref={ref} width={sizes.contextualBar} position={position} {...dialogProps} {...props} />
		</FocusScope>
	);
};

export default ContextualbarDialog;
