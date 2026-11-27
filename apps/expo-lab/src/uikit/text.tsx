import { memo, useMemo } from 'react';
import { Text } from 'react-native';
import { parse } from '@rocket.chat/message-parser';
import * as UiKit from '@rocket.chat/ui-kit';

import Markup from '../markup/Markup';
import { body, colors } from '../markup/theme';

// Same values as the web's fontScale c1 and color secondary-info for text in a context block
const contextText = { fontSize: 12, lineHeight: 16, color: colors.muted } as const;

const Mrkdwn = memo(function Mrkdwn({ text }: { text: string }) {
	const md = useMemo(() => {
		try {
			return parse(text);
		} catch {
			return undefined;
		}
	}, [text]);

	return md ? <Markup md={md} /> : <Text style={body}>{text}</Text>;
});

// Mirrors renderTextObject of fuselage-ui-kit/src/surfaces/FuselageSurfaceRenderer.tsx; the i18n lookup of text.i18n is not ported
export const renderTextObject = (textObject: UiKit.TextObject, context: UiKit.BlockContext, index: number) => {
	if (context === UiKit.BlockContext.BLOCK || typeof textObject?.text !== 'string') return null;

	if (textObject.type === 'mrkdwn') return <Mrkdwn key={index} text={textObject.text} />;

	return (
		<Text key={index} style={context === UiKit.BlockContext.CONTEXT ? contextText : body}>
			{textObject.text}
		</Text>
	);
};
