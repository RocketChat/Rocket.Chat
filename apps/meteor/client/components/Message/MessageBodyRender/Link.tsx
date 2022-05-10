import { Link as ASTLink } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import { baseURI } from '../../../lib/baseURI';
import Bold from './Bold';
import Italic from './Italic';
import PlainText from './PlainText';
import Strike from './Strike';

type LinkProps = {
	value: ASTLink['value'];
};

const Link: FC<LinkProps> = ({ value }) => {
	const { src, label } = value;
	const target = src.value.indexOf(baseURI) === 0 ? '' : '_blank';
	return (
		<a href={src.value} data-title={src.value} target={target} rel='noopener noreferrer'>
			{((block: ASTLink['value']['label']): JSX.Element | string | null => {
				switch (block.type) {
					case 'PLAIN_TEXT':
						return <PlainText value={block.value} />;
					case 'STRIKE':
						return <Strike value={block.value} />;
					case 'ITALIC':
						return <Italic value={block.value} />;
					case 'BOLD':
						return <Bold value={block.value} />;
					default:
						return null;
				}
			})(label)}
		</a>
	);
};

export default Link;
