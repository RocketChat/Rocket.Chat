import { HeaderV2ContentRow } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderContentRow = (props: ComponentProps<typeof HeaderV2ContentRow>) => <HeaderV2ContentRow {...props} />;

export default memo(HeaderContentRow);
