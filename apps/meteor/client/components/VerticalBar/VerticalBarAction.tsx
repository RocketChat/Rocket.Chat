import type { Icon } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';
import type { ReactElement, MouseEventHandler, ComponentProps } from 'react';
import React, { memo } from 'react';

const VerticalBarAction = ({
	name,
	...props
}: {
	name: ComponentProps<typeof Icon>['name'];
	title?: string;
	onClick?: MouseEventHandler<HTMLOrSVGElement>;
}): ReactElement => <IconButton flexShrink={0} icon={name} {...props} tiny />;

export default memo(VerticalBarAction);
