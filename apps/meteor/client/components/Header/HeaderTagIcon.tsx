import { HeaderV2TagIcon } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderTagIcon = (props: ComponentProps<typeof HeaderV2TagIcon>) => <HeaderV2TagIcon {...props} />;

export default memo(HeaderTagIcon);
