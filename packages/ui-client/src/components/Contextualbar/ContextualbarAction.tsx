import { ContextualbarV2Action } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const ContextualbarAction = (props: ComponentProps<typeof ContextualbarV2Action>) => <ContextualbarV2Action {...props} />;

export default memo(ContextualbarAction);
