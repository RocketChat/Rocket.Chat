import { Margins, Palette } from '@rocket.chat/fuselage';
import type { ReactNode, ComponentProps, CSSProperties } from 'react';

import { ListComponent } from './List.styles';

const List = ({
	children,
	listStyleType,
	icon,
	spacing = 'x6',
	color = Palette.text['font-default'].toString(),
}: {
	children: ReactNode;
	spacing?: ComponentProps<typeof Margins>['block'];
	listStyleType?: CSSProperties['listStyleType'];
	color?: CSSProperties['color'];
	icon?: string;
}) => (
	<ListComponent icon={icon} listStyleType={listStyleType} color={color}>
		<Margins block={spacing}>{children}</Margins>
	</ListComponent>
);

export default List;
