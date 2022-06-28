import type * as MessageParser from '@rocket.chat/message-parser';
import { ReactElement, useMemo } from 'react';

type PreviewCodeBlockProps = {
	language?: string;
	lines: MessageParser.CodeLine[];
};

export const PreviewCodeBlock = ({ lines }: PreviewCodeBlockProps): ReactElement | null => {
	const firstLine = useMemo(() => lines.find((line) => line.value.value.trim())?.value.value.trim(), [lines]);

	if (!firstLine) {
		return null;
	}

	return <>{firstLine}</>;
};

export default PreviewCodeBlock;
