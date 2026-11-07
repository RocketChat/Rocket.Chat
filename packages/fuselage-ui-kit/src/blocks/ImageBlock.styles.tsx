import styled from '@rocket.chat/styled';

import { serializeCssUrl } from '../utils/serializeCssUrl.js';

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
	box-shadow: 0 0 0px 1px rgba(204, 204, 204, 38%);
	background-repeat: no-repeat;
	background-position: 50%;
	background-size: cover;
	background-color: rgba(204, 204, 204, 38%);
	background-image: ${(props) => serializeCssUrl(props.imageUrl)};
	${(props) =>
		props.fluid
			? `width: 100%; max-width: ${String(props.width)}px; aspect-ratio: ${String(props.width)} / ${String(props.height)};`
			: `width: ${String(props.width)}px; height: ${String(props.height)}px;`}
	overflow: hidden;
`;
