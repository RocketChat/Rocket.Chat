import { ContextualbarV2Header } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';

const ContextualbarHeader = (props: ComponentPropsWithoutRef<typeof ContextualbarV2Header>) => (
	<ContextualbarV2Header mbs={-1} {...props} />
);
export default memo(ContextualbarHeader);
