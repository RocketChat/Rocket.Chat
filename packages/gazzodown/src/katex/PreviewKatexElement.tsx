import type { ReactElement } from 'react';

import 'katex/dist/katex.css';

type PreviewKatexElementProps = {
	code: string;
};

const PreviewKatexElement = ({ code }: PreviewKatexElementProps): ReactElement => <>{code}</>;

export default PreviewKatexElement;
