import { HeaderV2Tag } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderTag = (props: ComponentProps<typeof HeaderV2Tag>) => <HeaderV2Tag {...props} />;

export default memo(HeaderTag);
