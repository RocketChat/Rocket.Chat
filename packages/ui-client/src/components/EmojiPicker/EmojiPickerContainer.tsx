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
			width='x365'
			ref={ref}
			height='x300'
			bg='light'
			padding='x8'
			pbe='none'
			borderRadius={4}
			elevation='2'
			display='flex'
			flexDirection='column'
		/>
	);
});

export default EmojiPickerContainer;
