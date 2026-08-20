import { ContextualbarActions as FuselageContextualbarActions } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const ContextualbarActions = (props: ComponentProps<typeof FuselageContextualbarActions>) => <FuselageContextualbarActions {...props} />;

export default memo(ContextualbarActions);
