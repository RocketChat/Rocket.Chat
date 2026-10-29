import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type EmojiPickerCategoryWrapperProps = ComponentPropsWithoutRef<typeof Box>;

const EmojiPickerCategoryWrapper = (props: EmojiPickerCategoryWrapperProps) => <Box {...props} display='flex' flexWrap='wrap' />;

export default EmojiPickerCategoryWrapper;
