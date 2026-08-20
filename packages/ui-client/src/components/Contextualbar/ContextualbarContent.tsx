import { ContextualbarContent as FuselageContextualbarContent } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

const ContextualbarContent = forwardRef<HTMLElement, ComponentProps<typeof FuselageContextualbarContent>>(
	function ContextualbarContent(props, ref) {
		return <FuselageContextualbarContent ref={ref} {...props} />;
	},
);

export default memo(ContextualbarContent);
