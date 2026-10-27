import type { ReactElement } from 'react';

type ComposerPlainSpanProps = {
	text: string;
};

const ComposerPlainSpan = ({ text }: ComposerPlainSpanProps): ReactElement => <>{text}</>;

export default ComposerPlainSpan;
