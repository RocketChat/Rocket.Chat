import { ContextualbarIcon as FuselageContextualbarIcon } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const ContextualbarIcon = (props: ComponentProps<typeof FuselageContextualbarIcon>) => <FuselageContextualbarIcon {...props} />;

export default memo(ContextualbarIcon);
