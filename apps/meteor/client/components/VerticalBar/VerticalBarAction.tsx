import { IconButton, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement, memo, MouseEventHandler, ComponentProps } from 'react';

const VerticalBarAction = ({
	name,
	...props
}: {
	name: ComponentProps<typeof Icon>['name'];
	title?: string;
	onClick?: MouseEventHandler<HTMLOrSVGElement>;
}): ReactElement => <IconButton flexShrink={0} icon={name} {...props} tiny />;

export default memo(VerticalBarAction);
