import { Icon } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

const VerticalBarIcon = (props) => (
	<Icon {...props} pi='x2' size='x24'/>
);

export default memo(VerticalBarIcon);
