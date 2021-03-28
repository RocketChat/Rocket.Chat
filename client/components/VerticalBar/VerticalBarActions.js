import { ButtonGroup } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

function VerticalBarActions(props) {
	return <ButtonGroup medium {...props} />;
}

export default memo(VerticalBarActions);
