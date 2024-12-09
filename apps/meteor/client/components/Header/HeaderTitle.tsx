import { HeaderV2Title } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderTitle = (props: ComponentProps<typeof HeaderV2Title>) => <HeaderV2Title {...props} />;

export default memo(HeaderTitle);
