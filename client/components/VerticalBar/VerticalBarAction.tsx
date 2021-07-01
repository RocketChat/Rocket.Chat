import { ActionButton } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

const VerticalBarAction: FC<{
	name: string;
	title?: string;
	onClick?: () => void;
}> = ({ name, ...props }) => <ActionButton flexShrink={0} icon={name} ghost {...props} tiny />;

export default memo(VerticalBarAction);
