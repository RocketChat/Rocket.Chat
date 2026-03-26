import type { ReactElement } from 'react';
import { memo } from 'react';

type ComposerPlainSpanProps = {
	text: string;
};

const ComposerPlainSpan = ({ text }: ComposerPlainSpanProps): ReactElement => <>{text}</>;

export default memo(ComposerPlainSpan);
