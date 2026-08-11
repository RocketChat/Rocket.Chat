import { ContextualbarV2EmptyContent } from '@rocket.chat/fuselage';
import type { ComponentProps, RefAttributes } from 'react';
import { memo } from 'react';

export type ContextualbarEmptyContentProps = ComponentProps<typeof ContextualbarV2EmptyContent> & RefAttributes<HTMLElement>;

const ContextualbarEmptyContent = ({ ref, ...props }: ContextualbarEmptyContentProps) => (
	<ContextualbarV2EmptyContent ref={ref} {...props} />
);

export default memo(ContextualbarEmptyContent);
