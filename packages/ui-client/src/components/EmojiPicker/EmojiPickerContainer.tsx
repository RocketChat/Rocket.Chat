import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, RefAttributes } from 'react';

export type EmojiPickerContainerProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'style'> & RefAttributes<HTMLElement>;

const EmojiPickerContainer = ({ ref, ...props }: EmojiPickerContainerProps) => (
	<Box
		{...props}
		color='default'
		ref={ref}
		height='x480'
		backgroundColor='light'
		borderRadius={4}
		display='flex'
		flexDirection='column'
		marginBlock='neg-x12'
	/>
);

export default EmojiPickerContainer;
