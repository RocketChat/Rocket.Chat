import React, { memo, ReactElement } from 'react';

import { createKatexMessageRendering } from '../../app/katex/client';

type KatexProps = {
	text: string;
	options: {
		dollarSyntax: boolean;
		parenthesisSyntax: boolean;
	};
};

const Katex = ({ text, options }: KatexProps): ReactElement => (
	<span dangerouslySetInnerHTML={{ __html: createKatexMessageRendering(options)(text) }} />
);

export default memo(Katex);
