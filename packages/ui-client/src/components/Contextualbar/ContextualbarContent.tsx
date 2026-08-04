import { ContextualbarV2Content } from '@rocket.chat/fuselage';
import type { ComponentProps, RefAttributes } from 'react';
import { memo } from 'react';

export type ContextualbarContentProps = ComponentProps<typeof ContextualbarV2Content> & RefAttributes<HTMLElement>;

const ContextualbarContent = ({ ref, ...props }: ContextualbarContentProps) => <ContextualbarV2Content ref={ref} {...props} />;

export default memo(ContextualbarContent);
