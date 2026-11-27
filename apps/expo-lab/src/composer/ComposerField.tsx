import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import type { NativeComposer } from './useNativeComposer.ts';

// Web's composer bounds, the starting point for touch (R3). Heights are styles only: onContentSizeChange goes stale once the
// field is clamped (TEXTINPUT-FINDINGS, row 5), so no measured content size is ever read.
export const composerHeight = { min: 52, max: 155 } as const;

const border = 1;

// Fuselage palette, copied by hand as the rest of the app does
const colors = { text: '#2f343d', placeholder: '#6c727a', stroke: '#9ea2a8', primary: '#1d74f5', disabled: '#e4e7ea', disabledText: '#9ea2a8' };

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
		<View style={{ gap: 4 }}>
			{showHeight && (
				<Text style={{ fontSize: 11, color: colors.placeholder }}>
					field height {height ?? '?'} px (min {composerHeight.min}, max {composerHeight.max})
				</Text>
			)}
			<View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
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
						placeholderTextColor={colors.placeholder}
						accessibilityLabel='Message'
						style={{
							minHeight: composerHeight.min + (nudge % 2) * 0.01,
							maxHeight: composerHeight.max,
							borderWidth: border,
							borderColor: colors.stroke,
							borderRadius: 4,
							paddingHorizontal: 12,
							paddingTop: 14,
							paddingBottom: 14,
							fontSize: 14,
							lineHeight: 20,
							color: colors.text,
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
						borderRadius: 4,
						backgroundColor: canSend ? colors.primary : colors.disabled,
					}}
				>
					<Text style={{ fontWeight: '600', color: canSend ? '#ffffff' : colors.disabledText }}>Send</Text>
				</Pressable>
			</View>
		</View>
	);
}
