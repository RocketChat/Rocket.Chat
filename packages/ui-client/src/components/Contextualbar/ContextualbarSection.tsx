import { ContextualbarV2Section } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

const ContextualbarSection = forwardRef<HTMLElement, ComponentProps<typeof ContextualbarV2Section>>(
	function ContextualbarSection(props, ref) {
		return <ContextualbarV2Section ref={ref} {...props} />;
	},
);

export default memo(ContextualbarSection);
