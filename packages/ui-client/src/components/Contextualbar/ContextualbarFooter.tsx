import { ContextualbarV2Footer } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

const ContextualbarFooter = forwardRef<HTMLElement, ComponentProps<typeof ContextualbarV2Footer>>(function ContextualbarFooter(props, ref) {
	return <ContextualbarV2Footer ref={ref} {...props} />;
});

export default memo(ContextualbarFooter);
