import { HeaderV2ToolbarActionBadge } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderToolbarActionBadge = (props: ComponentProps<typeof HeaderV2ToolbarActionBadge>) => <HeaderV2ToolbarActionBadge {...props} />;

export default memo(HeaderToolbarActionBadge);
