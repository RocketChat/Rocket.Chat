import { Button } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

const VerticalBarButton = (props) => (
	<Button small square flexShrink={0} ghost {...props}/>
);

export default memo(VerticalBarButton);
