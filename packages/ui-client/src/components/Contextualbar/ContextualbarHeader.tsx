import { ContextualbarV2Header } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';

export type ContextualbarHeaderProps = ComponentPropsWithoutRef<typeof ContextualbarV2Header>;

const ContextualbarHeader = (props: ContextualbarHeaderProps) => <ContextualbarV2Header marginBlockStart={-1} {...props} />;
export default memo(ContextualbarHeader);
