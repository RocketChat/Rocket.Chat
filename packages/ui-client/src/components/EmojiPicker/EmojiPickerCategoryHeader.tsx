import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerCategoryHeader = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'style'>) => {
	return <Box {...props} is='ul' display='flex' mbe='x8' />;
};

export default EmojiPickerCategoryHeader;
