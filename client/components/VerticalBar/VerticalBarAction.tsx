import { ActionButton } from '@rocket.chat/fuselage';
import React, { ReactElement, memo, MouseEventHandler } from 'react';

const VerticalBarAction = ({
	name,
	...props
}: {
	name: string;
	title?: string;
	onClick?: MouseEventHandler<HTMLOrSVGElement>;
}): ReactElement => <ActionButton flexShrink={0} icon={name} ghost {...props} tiny />;

export default memo(VerticalBarAction);
