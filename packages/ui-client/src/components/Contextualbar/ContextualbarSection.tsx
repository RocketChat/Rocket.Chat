import { ContextualbarSection as FuselageContextualbarSection } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

const ContextualbarSection = forwardRef<HTMLElement, ComponentProps<typeof FuselageContextualbarSection>>(
	function ContextualbarSection(props, ref) {
		return <FuselageContextualbarSection ref={ref} {...props} />;
	},
);

export default memo(ContextualbarSection);
