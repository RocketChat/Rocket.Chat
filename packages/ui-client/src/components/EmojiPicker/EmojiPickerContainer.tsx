import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';
import { forwardRef } from 'react';

const EmojiPickerContainer = forwardRef<HTMLElement, Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'style'>>(function EmojiPickerContainer(
	props,
	ref,
) {
	return (
		<Box
			{...props}
			color='default'
			width='x344'
			ref={ref}
			height='x480'
			bg='light'
			borderRadius={4}
			elevation='2'
			display='flex'
			flexDirection='column'
		/>
	);
});

export default EmojiPickerContainer;
