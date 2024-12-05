import { HeaderV2Icon } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderIcon = (props: ComponentProps<typeof HeaderV2Icon>) => <HeaderV2Icon {...props} />;

export default memo(HeaderIcon);
