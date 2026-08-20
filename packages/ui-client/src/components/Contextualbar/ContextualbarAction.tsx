import { ContextualbarAction as FuselageContextualbarAction } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const ContextualbarAction = (props: ComponentProps<typeof FuselageContextualbarAction>) => <FuselageContextualbarAction {...props} />;

export default memo(ContextualbarAction);
