import { HeaderV2TitleButton } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderTitleButton = (props: ComponentProps<typeof HeaderV2TitleButton>) => <HeaderV2TitleButton {...props} />;

export default memo(HeaderTitleButton);
