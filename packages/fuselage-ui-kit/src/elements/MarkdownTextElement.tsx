import { Skeleton } from '@rocket.chat/fuselage';
import { Markup } from '@rocket.chat/gazzodown';
import { parse } from '@rocket.chat/message-parser';
import type { TextObject } from '@rocket.chat/ui-kit';
import { Suspense } from 'react';

import { useAppTranslation } from '../hooks/useAppTranslation';

export type MarkdownTextElementProps = { textObject: TextObject };

const MarkdownTextElement = ({ textObject }: MarkdownTextElementProps) => {
	const { t } = useAppTranslation();

	const text = textObject.i18n
		? t(textObject.i18n.key, { ns: textObject.i18n.ns, defaultValue: textObject.text, ...textObject.i18n.args })
		: textObject.text;

	if (!text) {
		return null;
	}

	return (
		<Suspense fallback={<Skeleton />}>
			<Markup tokens={parse(text, { emoticons: false })} />
		</Suspense>
	);
};

export default MarkdownTextElement;
