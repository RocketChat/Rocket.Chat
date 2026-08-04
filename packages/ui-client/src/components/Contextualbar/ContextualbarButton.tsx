import { ContextualbarV2Button } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { memo } from 'react';

export type ContextualbarButtonProps = ComponentProps<typeof ContextualbarV2Button>;

const ContextualbarButton = (props: ContextualbarButtonProps) => <ContextualbarV2Button {...props} />;

export default memo(ContextualbarButton);
