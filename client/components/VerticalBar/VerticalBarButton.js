import { Button } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

function VerticalBarButton(props) {
	return <Button small square flexShrink={0} ghost {...props} />;
}

export default memo(VerticalBarButton);
