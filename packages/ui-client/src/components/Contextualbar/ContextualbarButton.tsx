import { ContextualbarButton as FuselageContextualbarButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const ContextualbarButton = (props: ComponentProps<typeof FuselageContextualbarButton>) => <FuselageContextualbarButton {...props} />;

export default memo(ContextualbarButton);
