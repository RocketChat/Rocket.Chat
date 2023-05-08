import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerCategoryWrapper = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>) => {
	return <Box {...props} display='flex' flexWrap='wrap' />;
};

export default EmojiPickerCategoryWrapper;
