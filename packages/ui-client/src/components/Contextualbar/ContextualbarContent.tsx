import { ContextualbarV2Content } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

const ContextualbarContent = forwardRef<HTMLElement, ComponentProps<typeof ContextualbarV2Content>>(
	function ContextualbarContent(props, ref) {
		return <ContextualbarV2Content ref={ref} {...props} />;
	},
);

export default memo(ContextualbarContent);
