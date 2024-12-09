import { HeaderV2Avatar } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderAvatar = (props: ComponentProps<typeof HeaderV2Avatar>) => <HeaderV2Avatar {...props} />;

export default memo(HeaderAvatar);
