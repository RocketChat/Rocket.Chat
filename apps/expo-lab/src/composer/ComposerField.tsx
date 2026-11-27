import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { composerTokens } from './tokens.ts';
import type { NativeComposer } from './useNativeComposer.ts';

// Web's composer bounds, the starting point for touch (R3). Heights are styles only: onContentSizeChange goes stale once the
// field is clamped (TEXTINPUT-FINDINGS, row 5), so no measured content size is ever read.
export const composerHeight = { min: composerTokens().size.x52, max: 155 } as const;

// The app is light only for now (FuselageProvider's defaultTheme)
const t = composerTokens('light');

type Props = {
	composer: NativeComposer;
	// The caller sends; the field clears at once and gets its text back if the caller answers `false`
	onSubmit: (text: string) => void | boolean | Promise<void | boolean>;
	placeholder?: string;
	// Dev only: shows the field's laid out height, read from onLayout, to prove the clamp
	showHeight?: boolean;
};

export function ComposerField({ composer, onSubmit, placeholder = 'Message', showHeight }: Props) {
	const { api, text, selection, inputRef, onChangeText, onSelectionChange } = composer;
	const [height, setHeight] = useState<number>();
	const [nudge, setNudge] = useState(0);
	// iOS keeps the size measured for the previous text until another commit reaches the field (observed: growth and shrink lag by
	// one update after a programmatic edit); a layout-neutral style change after each text change forces that commit
	useEffect(() => {
		const t = setTimeout(() => setNudge((n) => n + 1), 50);
		return () => clearTimeout(t);
	}, [text]);
	const canSend = text.trim() !== '';

	const submit = () => {
		if (!canSend) return;
		const sent = text;
		api.clear();
		void Promise.resolve(onSubmit(sent)).then((accepted) => {
			if (accepted === false && api.text === '') api.setText(sent);
		});
	};

	return (
		<View style={{ gap: t.space.x4 }}>
			{showHeight && (
				<Text style={{ ...t.fontScale.c1, color: t.font.annotation }}>
					field height {height ?? '?'} px (min {composerHeight.min}, max {composerHeight.max})
				</Text>
			)}
			<View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: t.space.x8 }}>
				<View style={{ flex: 1 }}>
					<TextInput
						ref={inputRef}
						multiline
						value={text}
						selection={selection}
						onChangeText={onChangeText}
						onSelectionChange={onSelectionChange}
						onLayout={(e) => setHeight(Math.round(e.nativeEvent.layout.height))}
						placeholder={placeholder}
						placeholderTextColor={t.font.annotation}
						accessibilityLabel='Message'
						style={{
							minHeight: composerHeight.min + (nudge % 2) * 0.01,
							maxHeight: composerHeight.max,
							borderWidth: t.borderWidth,
							borderColor: t.stroke.light,
							borderRadius: t.radius.medium,
							paddingHorizontal: t.space.x12,
							paddingVertical: t.space.x16 - t.borderWidth,
							...t.fontScale.p2,
							color: t.font.default,
						}}
					/>
				</View>
				<Pressable
					onPress={submit}
					disabled={!canSend}
					accessibilityRole='button'
					accessibilityLabel='Send message'
					accessibilityState={{ disabled: !canSend }}
					style={{
						height: composerHeight.min,
						minWidth: 64,
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: t.radius.medium,
						backgroundColor: canSend ? t.button.primary : t.button.primaryDisabled,
					}}
				>
					<Text style={{ ...t.fontScale.p2b, color: canSend ? t.button.onPrimary : t.button.onPrimaryDisabled }}>Send</Text>
				</Pressable>
			</View>
		</View>
	);
}
