import { Box } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import type { AllHTMLAttributes } from 'react';
import { forwardRef } from 'react';

const EmojiPickerContainer = forwardRef<HTMLElement, Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'style'>>(function EmojiPickerContainer(
	props,
	ref,
) {
	const isMobile = useMediaQuery('(max-width: 500px)');

	return (
		<Box
			{...props}
			color='default'
			width={isMobile ? 'full' : 'x344'}
			ref={ref}
			height='x480'
			bg='light'
			borderRadius={4}
			elevation='2'
			display='flex'
			flexDirection='column'
			mb='neg-x12'
		/>
	);
});

export default EmojiPickerContainer;
