import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerPreviewArea = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>) => (
	<Box
		{...props}
		p={12}
		bg='tint'
		color='secondary-info'
		display='flex'
		alignItems='center'
		justifyContent='space-between'
		minHeight='x64'
	/>
);

export default EmojiPickerPreviewArea;
