import { Palette, borderRadius, borderWidth } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';

import { serializeCssUrl } from '../utils/serializeCssUrl';

const filterElementProps = ({ imageUrl: _imageUrl, size: _size, ...props }: { imageUrl: string; size: number }) => props;

export const Element = styled('div', filterElementProps)`
	box-sizing: border-box;
	border-width: ${String(borderWidth('default'))};
	border-style: solid;
	border-color: ${Palette.stroke['stroke-extra-light'].toString()};
	background-repeat: no-repeat;
	background-position: 50%;
	background-size: cover;
	background-color: ${Palette.surface['surface-tint'].toString()};
	background-image: ${(props) => serializeCssUrl(props.imageUrl)};
	width: ${(props) => String(props.size)}px;
	height: ${(props) => String(props.size)}px;
	border-radius: ${String(borderRadius('medium'))};
	overflow: hidden;
`;
