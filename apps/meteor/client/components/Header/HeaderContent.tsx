import { HeaderV2Content } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderContent = (props: ComponentProps<typeof HeaderV2Content>) => <HeaderV2Content {...props} />;

export default memo(HeaderContent);
