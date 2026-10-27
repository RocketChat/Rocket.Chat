import type { BoxProps } from '@rocket.chat/fuselage';
import { Palette } from '@rocket.chat/fuselage';
import type { ReactNode, CSSProperties } from 'react';

import { ListComponent } from './List.styles';

const List = ({
	children,
	listStyleType,
	icon,
	spacing = 'x6',
	color = Palette.text['font-default'].toString(),
}: {
	children: ReactNode;
	spacing?: BoxProps['marginBlock'];
	listStyleType?: CSSProperties['listStyleType'];
	color?: CSSProperties['color'];
	icon?: string;
}) => (
	<ListComponent icon={icon} listStyleType={listStyleType} color={color} spacing={spacing}>
		{children}
	</ListComponent>
);

export default List;
