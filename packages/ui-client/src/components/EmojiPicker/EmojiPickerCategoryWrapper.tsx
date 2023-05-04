import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerCategoryWrapper = (props: Omit<AllHTMLAttributes<HTMLUListElement>, 'style'>) => {
	return <Box {...props} is='ul' mb='x8' display='flex' flexWrap='wrap' />;
};

export default EmojiPickerCategoryWrapper;
