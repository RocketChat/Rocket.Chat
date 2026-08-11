import { ContextualbarV2Actions } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { memo } from 'react';

export type ContextualbarActionsProps = ComponentProps<typeof ContextualbarV2Actions>;

const ContextualbarActions = (props: ContextualbarActionsProps) => <ContextualbarV2Actions {...props} />;

export default memo(ContextualbarActions);
