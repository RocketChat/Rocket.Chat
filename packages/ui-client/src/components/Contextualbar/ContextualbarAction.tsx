import { ContextualbarV2Action } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { memo } from 'react';

export type ContextualbarActionProps = ComponentProps<typeof ContextualbarV2Action>;

const ContextualbarAction = (props: ContextualbarActionProps) => <ContextualbarV2Action {...props} />;

export default memo(ContextualbarAction);
