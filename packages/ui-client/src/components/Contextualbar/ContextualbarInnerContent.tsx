import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import { memo } from 'react';

const ContextualbarInnerContent = (props: BoxProps) => (
	<Box rcx-vertical-bar--inner-content position='absolute' height='full' display='flex' insetInline={0} {...props} />
);

export default memo(ContextualbarInnerContent);
