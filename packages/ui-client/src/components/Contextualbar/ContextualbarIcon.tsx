import { ContextualbarV2Icon } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { memo } from 'react';

export type ContextualbarIconProps = ComponentProps<typeof ContextualbarV2Icon>;

const ContextualbarIcon = (props: ContextualbarIconProps) => <ContextualbarV2Icon {...props} />;

export default memo(ContextualbarIcon);
