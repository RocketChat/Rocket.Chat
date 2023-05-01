import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerListArea = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'style'>) => {
	return <Box {...props} w='full' h='full' overflow='hidden' />;
};

export default EmojiPickerListArea;
