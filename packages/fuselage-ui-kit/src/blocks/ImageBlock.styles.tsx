import { Palette, borderRadius, borderWidth } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';

import { serializeCssUrl } from '../utils/serializeCssUrl';

const filterImageProps = ({
	imageUrl: _imageUrl,
	width: _width,
	height: _height,
	fluid: _fluid,
	...props
}: {
	imageUrl: string;
	width: number;
	height: number;
	fluid?: boolean;
}) => props;

// A fluid image fills its container up to its own `width`, keeping the `width`/`height` proportions.
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
	${(props) =>
		props.fluid
			? `width: 100%; max-width: ${String(props.width)}px; aspect-ratio: ${String(props.width)} / ${String(props.height)};`
			: `width: ${String(props.width)}px; height: ${String(props.height)}px;`}
	overflow: hidden;
`;
