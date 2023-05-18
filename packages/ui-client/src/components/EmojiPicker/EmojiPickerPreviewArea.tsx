import type { AllHTMLAttributes } from 'react';
import { Box } from '@rocket.chat/fuselage';

const EmojiPickerPreviewArea = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>) => {
	return (
		<Box
			{...props}
			p='x12'
			bg='tint'
			color='secondary-info'
			display='flex'
			alignItems='center'
			justifyContent='space-between'
			minHeight='x64'
		/>
	);
};

export default EmojiPickerPreviewArea;
