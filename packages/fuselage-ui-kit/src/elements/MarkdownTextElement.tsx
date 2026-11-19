import { Skeleton } from '@rocket.chat/fuselage';
import { Markup } from '@rocket.chat/gazzodown';
import { parse } from '@rocket.chat/message-parser';
import type { TextObject } from '@rocket.chat/ui-kit';
import { Suspense } from 'react';

import { useAppTranslation } from '../hooks/useAppTranslation';
import { inlineBigEmoji } from '../utils/inlineBigEmoji';

export type MarkdownTextElementProps = { textObject: TextObject; bigEmoji?: boolean };

const MarkdownTextElement = ({ textObject, bigEmoji = false }: MarkdownTextElementProps) => {
	const { t } = useAppTranslation();

	const text = textObject.i18n
		? t(textObject.i18n.key, { ...textObject.i18n.args, ns: textObject.i18n.ns, defaultValue: textObject.text })
		: textObject.text;

	if (!text) {
		return null;
	}

	const tokens = parse(text, { emoticons: false });

	return (
		<Suspense fallback={<Skeleton />}>
			<Markup tokens={bigEmoji ? tokens : inlineBigEmoji(tokens)} />
		</Suspense>
	);
};

export default MarkdownTextElement;
