import React, { FC, memo } from 'react';

import { createKatexMessageRendering } from '../../app/katex/client';

type KatexType = {
	text: string;
	options: {
		dollarSyntax: boolean;
		parenthesisSyntax: boolean;
	};
};

const Katex: FC<KatexType> = ({ text, options }) => (
	<span dangerouslySetInnerHTML={{ __html: createKatexMessageRendering(options)(`${text}`) }} />
);

export default memo(Katex);
