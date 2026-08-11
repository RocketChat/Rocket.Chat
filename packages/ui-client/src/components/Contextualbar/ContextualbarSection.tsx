import { ContextualbarV2Section } from '@rocket.chat/fuselage';
import type { ComponentProps, RefAttributes } from 'react';
import { memo } from 'react';

export type ContextualbarSectionProps = ComponentProps<typeof ContextualbarV2Section> & RefAttributes<HTMLElement>;

const ContextualbarSection = ({ ref, ...props }: ContextualbarSectionProps) => <ContextualbarV2Section ref={ref} {...props} />;

export default memo(ContextualbarSection);
