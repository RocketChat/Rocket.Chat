import { Palette } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';

const CardSlotContainerInner = styled('span')`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	opacity: 0.7;
	background-color: ${Palette.surface['surface-hover'].toString()};
	color: ${Palette.text['font-default'].toString()};
	z-index: 2;
`;

export default CardSlotContainerInner;
