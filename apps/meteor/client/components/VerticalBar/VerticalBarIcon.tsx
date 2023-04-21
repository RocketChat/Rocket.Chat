import { Icon } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';
import React, { memo } from 'react';

const VerticalBarIcon = (props: ComponentProps<typeof Icon>): ReactElement => <Icon {...props} pi='x2' size='x24' />;

export default memo(VerticalBarIcon);
