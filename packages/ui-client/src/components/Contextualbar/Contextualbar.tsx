import { ContextualbarV2 } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

const Contextualbar = forwardRef<HTMLElement, ComponentProps<typeof ContextualbarV2>>(function Contextualbar(props, ref) {
	return <ContextualbarV2 ref={ref} {...props} />;
});

export default memo(Contextualbar);
