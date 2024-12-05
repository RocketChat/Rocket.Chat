import { ContextualbarV2Icon } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const ContextualbarIcon = (props: ComponentProps<typeof ContextualbarV2Icon>) => <ContextualbarV2Icon {...props} />;

export default memo(ContextualbarIcon);
