import { HeaderV2State } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderState = (props: ComponentProps<typeof HeaderV2State>) => <HeaderV2State {...props} />;

export default memo(HeaderState);
