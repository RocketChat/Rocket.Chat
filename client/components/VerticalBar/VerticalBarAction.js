import { ActionButton } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

function VerticalBarAction({ name, ...props }) {
	return <ActionButton flexShrink={0} icon={name} ghost {...props} tiny />;
}

export default memo(VerticalBarAction);
