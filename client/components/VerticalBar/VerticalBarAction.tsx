import { ActionButton, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement, memo, MouseEventHandler, ComponentProps } from 'react';

const VerticalBarAction = ({
	name,
	...props
}: {
	name: ComponentProps<typeof Icon>['name'];
	title?: string;
	onClick?: MouseEventHandler<HTMLOrSVGElement>;
}): ReactElement => <ActionButton flexShrink={0} icon={name} ghost {...props} tiny />;

export default memo(VerticalBarAction);
