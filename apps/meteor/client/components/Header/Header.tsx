import { HeaderV2 } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const Header = (props: ComponentProps<typeof HeaderV2>) => <HeaderV2 {...props} />;

export default memo(Header);
