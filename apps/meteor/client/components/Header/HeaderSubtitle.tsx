import { HeaderV2Subtitle } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderSubtitle = (props: ComponentProps<typeof HeaderV2Subtitle>) => <HeaderV2Subtitle {...props} />;

export default memo(HeaderSubtitle);
