import { ContextualbarV2Footer } from '@rocket.chat/fuselage';
import type { ComponentProps, RefAttributes } from 'react';
import { memo } from 'react';

export type ContextualbarFooterProps = ComponentProps<typeof ContextualbarV2Footer> & RefAttributes<HTMLElement>;

const ContextualbarFooter = ({ ref, ...props }: ContextualbarFooterProps) => <ContextualbarV2Footer ref={ref} {...props} />;

export default memo(ContextualbarFooter);
