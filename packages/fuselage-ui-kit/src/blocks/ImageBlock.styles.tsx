import { Palette, borderRadius, borderWidth } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';

import { serializeCssUrl } from '../utils/serializeCssUrl';

const filterImageProps = ({
	imageUrl: _imageUrl,
	width: _width,
	height: _height,
	...props
}: {
	imageUrl: string;
	width: number;
	height: number;
}) => props;

export const Image = styled('div', filterImageProps)`
	box-sizing: border-box;
	border-width: ${String(borderWidth('default'))};
	border-style: solid;
	border-color: ${Palette.stroke['stroke-extra-light'].toString()};
	border-radius: ${String(borderRadius('large'))};
	background-repeat: no-repeat;
	background-position: 50%;
	background-size: cover;
	background-color: ${Palette.surface['surface-tint'].toString()};
	background-image: ${(props) => serializeCssUrl(props.imageUrl)};
	width: 100%;
	max-width: ${(props) => String(props.width)}px;
	aspect-ratio: ${(props) => String(props.width)} / ${(props) => String(props.height)};
	overflow: hidden;
`;
