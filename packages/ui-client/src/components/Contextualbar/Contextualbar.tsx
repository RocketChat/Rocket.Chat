import { ContextualbarV2 } from '@rocket.chat/fuselage';
import type { ComponentProps, RefAttributes } from 'react';
import { memo } from 'react';

export type ContextualbarProps = ComponentProps<typeof ContextualbarV2> & RefAttributes<HTMLElement>;

const Contextualbar = ({ ref, ...props }: ContextualbarProps) => <ContextualbarV2 ref={ref} {...props} />;

export default memo(Contextualbar);
