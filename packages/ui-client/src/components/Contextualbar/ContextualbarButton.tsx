import { ContextualbarV2Button } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const ContextualbarButton = (props: ComponentProps<typeof ContextualbarV2Button>) => <ContextualbarV2Button {...props} />;

export default memo(ContextualbarButton);
