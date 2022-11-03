import type { ReactElement } from 'react';

import 'katex/dist/katex.css';

type PreviewKatexBlockProps = {
	code: string;
};

const PreviewKatexBlock = ({ code }: PreviewKatexBlockProps): ReactElement => <>{code}</>;

export default PreviewKatexBlock;
