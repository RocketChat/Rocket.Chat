import { ActionButton } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

const VerticalBarAction = ({ name, ...props }) => (
	<ActionButton flexShrink={0} icon={name} ghost {...props} tiny />
);

export default memo(VerticalBarAction);
