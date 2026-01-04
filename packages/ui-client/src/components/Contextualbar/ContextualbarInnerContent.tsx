import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';
import { memo } from 'react';

const ContextualbarInnerContent = (props: ComponentProps<typeof Box>): ReactElement => (
	<Box rcx-vertical-bar--inner-content position='absolute' height='full' display='flex' insetInline={0} {...props} />
);

export default memo(ContextualbarInnerContent);
