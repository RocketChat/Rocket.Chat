import { ButtonGroup } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

const VerticalBarActions = (props) => (
	<ButtonGroup medium {...props} />
);

export default memo(VerticalBarActions);
