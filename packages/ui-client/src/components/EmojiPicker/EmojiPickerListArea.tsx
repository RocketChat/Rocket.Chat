import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerListArea = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'style'>) => (
	<Box {...props} w='full' h='full' pis={12} overflow='hidden' />
);

export default EmojiPickerListArea;
