import { ContextualbarFooter as FuselageContextualbarFooter } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

const ContextualbarFooter = forwardRef<HTMLElement, ComponentProps<typeof FuselageContextualbarFooter>>(
	function ContextualbarFooter(props, ref) {
		return <FuselageContextualbarFooter ref={ref} {...props} />;
	},
);

export default memo(ContextualbarFooter);
