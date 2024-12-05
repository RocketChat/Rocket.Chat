import { HeaderV2Toolbar } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderToolbar = (props: ComponentProps<typeof HeaderV2Toolbar>) => <HeaderV2Toolbar {...props} />;

export default memo(HeaderToolbar);
