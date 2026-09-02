import type { TextObject } from '@rocket.chat/ui-kit';

import { useAppTranslation } from '../hooks/useAppTranslation';

export type PlainTextElementProps = { textObject: TextObject };

const PlainTextElement = ({ textObject }: PlainTextElementProps) => {
	const { t } = useAppTranslation();

	const text = textObject.i18n
		? t(textObject.i18n.key, { ns: textObject.i18n.ns, defaultValue: textObject.text, ...textObject.i18n.args })
		: textObject.text;

	return <>{text}</>;
};

export default PlainTextElement;
