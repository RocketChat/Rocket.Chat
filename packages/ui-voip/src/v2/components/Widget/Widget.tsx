import { Palette } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';

// TODO: Initial position from the draggable api instead of style props
// TODO: A11Y
const Widget = styled('article')`
	position: fixed;
	display: flex;
	flex-direction: column;
	width: 248px;
	min-height: 128px;
	border-radius: 4px;
	border: 1px solid ${Palette.stroke['stroke-dark'].toString()};
	box-shadow:
		0px 0px 1px 0px ${Palette.shadow['shadow-elevation-2x'].toString()},
		0px 0px 12px 0px ${Palette.shadow['shadow-elevation-2y'].toString()};
	background-color: ${Palette.surface['surface-tint'].toString()};
	z-index: 100;
	overflow: hidden;
`;

export default Widget;
