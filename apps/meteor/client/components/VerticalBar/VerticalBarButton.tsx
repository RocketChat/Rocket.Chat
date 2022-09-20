import { Button } from '@rocket.chat/fuselage';
import React, { ComponentProps, memo, ReactElement } from 'react';

const VerticalBarButton = (props: ComponentProps<typeof Button>): ReactElement => (
	<Button small square flexShrink={0} secondary {...props} />
);

export default memo(VerticalBarButton);
