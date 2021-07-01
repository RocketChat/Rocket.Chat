import { Icon } from '@rocket.chat/fuselage';
import React, { FC, ComponentProps, memo } from 'react';

const VerticalBarIcon: FC<ComponentProps<typeof Icon>> = (props) => (
	<Icon {...props} pi='x2' size='x24' />
);

export default memo(VerticalBarIcon);
