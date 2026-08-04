import { ContextualbarV2EmptyContent } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

const ContextualbarEmptyContent = forwardRef<HTMLElement, ComponentProps<typeof ContextualbarV2EmptyContent>>(
	function ContextualbarEmptyContent(props, ref) {
		return <ContextualbarV2EmptyContent ref={ref} {...props} />;
	},
);

export default memo(ContextualbarEmptyContent);
