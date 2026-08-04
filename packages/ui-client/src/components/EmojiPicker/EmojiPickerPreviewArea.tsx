import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

export type EmojiPickerPreviewAreaProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;

const EmojiPickerPreviewArea = (props: EmojiPickerPreviewAreaProps) => (
	<Box
		{...props}
		padding={12}
		backgroundColor='tint'
		color='secondary-info'
		display='flex'
		alignItems='center'
		justifyContent='space-between'
		minHeight='x64'
	/>
);

export default EmojiPickerPreviewArea;
