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
			ref={ref}
			height='x480'
			bg='light'
			borderRadius={4}
			display='flex'
			flexDirection='column'
			mb='neg-x12'
		/>
	);
});

export default EmojiPickerContainer;
