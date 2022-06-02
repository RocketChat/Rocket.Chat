import * as MessageParser from '@rocket.chat/message-parser';
import React, { ReactElement, useMemo } from 'react';

import { flattenMarkup } from '../flattenMarkup';

const style = {
	maxWidth: '100%',
};

type ImageElementProps = {
	src: string;
	alt: MessageParser.Markup;
};

const ImageElement = ({ src, alt }: ImageElementProps): ReactElement => {
	const plainAlt = useMemo(() => flattenMarkup(alt), [alt]);

	return (
		<a href={src} target='_blank' rel='noopener noreferrer' title={plainAlt}>
			<img src={src} data-title={src} alt={plainAlt} style={style} />
		</a>
	);
};

export default ImageElement;
