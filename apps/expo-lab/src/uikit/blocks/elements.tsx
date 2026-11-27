import { useContext, useState } from 'react';
import { Image, Pressable, Text } from 'react-native';
import * as UiKit from '@rocket.chat/ui-kit';

import { UiKitContext } from '../context';

// Fuselage's Button frame does not centre its label nor colour it by variant natively (README, "Fuselage on React Native"), so this copies the web look by hand
const palette = {
	primary: { bg: '#1d74f5', fg: '#ffffff', border: '#1d74f5' },
	secondary: { bg: '#e4e7ea', fg: '#2f343d', border: '#e4e7ea' },
	danger: { bg: '#f5455c', fg: '#ffffff', border: '#f5455c' },
	warning: { bg: '#ffd031', fg: '#2f343d', border: '#ffd031' },
	success: { bg: '#2de0a5', fg: '#2f343d', border: '#2de0a5' },
} as const;

const outlined = { secondary: '#2f343d', danger: '#d1253a', warning: '#a37900', success: '#0f7a58' } as const;

// Mirrors getVariant of fuselage-ui-kit/src/elements/ButtonElement.tsx: only `style` and `secondary` pick the look
const lookOf = (style: UiKit.ButtonElement['style'], secondary: boolean | undefined) => {
	const kind = style && style in palette ? style : 'secondary';
	if (secondary && kind !== 'primary') return { bg: 'transparent', fg: outlined[kind], border: outlined[kind] };
	return palette[kind];
};

export function ButtonElement({ block }: { block: UiKit.ButtonElement }) {
	const { onAction } = useContext(UiKitContext);
	const [pressed, setPressed] = useState(false);
	const look = lookOf(block.style, block.secondary);

	return (
		<Pressable
			accessibilityRole='button'
			accessibilityLabel={block.accessibility_label ?? block.text?.text}
			onPress={() => onAction({ appId: block.appId, blockId: block.blockId, actionId: block.actionId, value: block.value })}
			onPressIn={() => setPressed(true)}
			onPressOut={() => setPressed(false)}
			style={{ backgroundColor: look.bg, borderColor: look.border, borderWidth: 1, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6, opacity: pressed ? 0.7 : 1, alignItems: 'center', justifyContent: 'center' }}
		>
			<Text style={{ color: look.fg, fontSize: 14, lineHeight: 20, fontWeight: '600' }}>{block.text?.text}</Text>
		</Pressable>
	);
}

// Only absolute https URLs: app payloads are untrusted, and the web renderer allows the same for video
export const isRemoteImage = (url: unknown): url is string => typeof url === 'string' && /^https:\/\//i.test(url);

// Mirrors ImageElement.tsx: 88 px as a section accessory, 20 px in a context block, nothing elsewhere
export function ImageElement({ block, context }: { block: UiKit.ImageElement; context: UiKit.BlockContext }) {
	const size = (context === UiKit.BlockContext.SECTION && 88) || (context === UiKit.BlockContext.CONTEXT && 20) || undefined;
	if (!size || !isRemoteImage(block.imageUrl)) return null;

	return <Image source={{ uri: block.imageUrl }} accessibilityLabel={block.altText} style={{ width: size, height: size, borderRadius: 4, backgroundColor: '#f2f3f5' }} />;
}
