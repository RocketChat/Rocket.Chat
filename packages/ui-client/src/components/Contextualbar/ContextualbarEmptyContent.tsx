import { ContextualbarEmptyContent as FuselageContextualbarEmptyContent } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

const ContextualbarEmptyContent = forwardRef<HTMLElement, ComponentProps<typeof FuselageContextualbarEmptyContent>>(
	function ContextualbarEmptyContent(props, ref) {
		return <FuselageContextualbarEmptyContent ref={ref} {...props} />;
	},
);

export default memo(ContextualbarEmptyContent);
