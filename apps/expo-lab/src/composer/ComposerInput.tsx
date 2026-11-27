import type { ComponentRef, Ref } from 'react';
import type { LayoutChangeEvent, TextInputSelectionChangeEvent } from 'react-native';
import { TextInput } from 'react-native';

import { composerTokens } from './tokens.ts';

const t = composerTokens('light');

// Heights are styles only: onContentSizeChange goes stale once the field is clamped (TEXTINPUT-FINDINGS, row 5)
export const composerHeight = { min: t.size.x52, max: 155 } as const;

type Props = {
	ref?: Ref<ComponentRef<typeof TextInput>>;
	value: string;
	selection: { start: number; end: number };
	onChangeText: (text: string) => void;
	onSelectionChange: (event: TextInputSelectionChangeEvent) => void;
	onLayout?: (event: LayoutChangeEvent) => void;
	placeholder?: string;
	// A layout-neutral flip that forces the commit iOS needs to re-measure after a programmatic edit
	nudge?: number;
};

// Web counterpart: packages/ui-composer/src/MessageComposer/MessageComposerInput.tsx (color default, fontScale p2, padding 12/16, 52 to 155)
export function ComposerInput({ ref, value, selection, onChangeText, onSelectionChange, onLayout, placeholder, nudge = 0 }: Props) {
	return (
		<TextInput
			ref={ref}
			multiline
			value={value}
			selection={selection}
			onChangeText={onChangeText}
			onSelectionChange={onSelectionChange}
			onLayout={onLayout}
			placeholder={placeholder}
			placeholderTextColor={t.font.annotation}
			accessibilityLabel='Message'
			style={{
				minHeight: composerHeight.min + (nudge % 2) * 0.01,
				maxHeight: composerHeight.max,
				paddingHorizontal: t.space.x12,
				paddingVertical: t.space.x16,
				...t.fontScale.p2,
				color: t.font.default,
			}}
		/>
	);
}
