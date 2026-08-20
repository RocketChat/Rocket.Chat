import { Contextualbar as FuselageContextualbar } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

const Contextualbar = forwardRef<HTMLElement, ComponentProps<typeof FuselageContextualbar>>(function Contextualbar(props, ref) {
	return <FuselageContextualbar ref={ref} {...props} />;
});

export default memo(Contextualbar);
