import { ContextualbarV2Actions } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const ContextualbarActions = (props: ComponentProps<typeof ContextualbarV2Actions>) => <ContextualbarV2Actions {...props} />;

export default memo(ContextualbarActions);
