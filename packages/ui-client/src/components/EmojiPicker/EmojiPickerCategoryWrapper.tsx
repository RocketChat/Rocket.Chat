import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const EmojiPickerCategoryWrapper = (props: ComponentProps<typeof Box>) => <Box {...props} display='flex' flexWrap='wrap' />;

export default EmojiPickerCategoryWrapper;
