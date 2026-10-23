import { ContextualbarHeader as FuselageContextualbarHeader } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';

const ContextualbarHeader = (props: ComponentPropsWithoutRef<typeof FuselageContextualbarHeader>) => (
	<FuselageContextualbarHeader {...props} />
);
export default memo(ContextualbarHeader);
