import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import React, { memo } from 'react';

const VerticalBarButton = (props: ComponentProps<typeof Button>): ReactElement => (
	<Button small square flexShrink={0} secondary {...props} />
);

export default memo(VerticalBarButton);
