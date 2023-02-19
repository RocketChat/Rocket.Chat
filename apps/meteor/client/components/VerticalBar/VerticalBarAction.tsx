import type { Icon } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';
import type { ReactElement, MouseEventHandler, ComponentProps } from 'react';
import React, { memo } from 'react';

type VerticalBarActionProps = {
	name: ComponentProps<typeof Icon>['name'];
	title?: string;
	disabled?: boolean;
	onClick?: MouseEventHandler<HTMLOrSVGElement>;
};

const VerticalBarAction = ({ name, ...props }: VerticalBarActionProps): ReactElement => (
	<IconButton flexShrink={0} icon={name} {...props} tiny />
);

export default memo(VerticalBarAction);
