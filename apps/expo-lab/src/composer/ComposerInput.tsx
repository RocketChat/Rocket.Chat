import { Box } from '@rocket.chat/fuselage';
import type { RefObject } from 'react';
import type { LayoutChangeEvent, TextInputSelectionChangeEvent } from 'react-native';

import type { FieldHandle } from './createNativeComposerAPI.ts';
import { composerTokens } from './tokens.ts';

const t = composerTokens('light');

// Heights are styles only: onContentSizeChange goes stale once the field is clamped (TEXTINPUT-FINDINGS, row 5)
export const composerHeight = { min: t.size.x52, max: 155 } as const;

type Props = {
	ref: RefObject<FieldHandle | null>;
	value: string;
	selection: { start: number; end: number };
	onChangeText: (text: string) => void;
	onSelectionChange: (event: TextInputSelectionChangeEvent) => void;
	onLayout?: (event: LayoutChangeEvent) => void;
	placeholder?: string;
	// A layout-neutral flip that forces the commit iOS needs to re-measure after a programmatic edit
	nudge?: number;
};

// Web counterpart: packages/ui-composer/src/MessageComposer/MessageComposerInput.tsx, the same Box textarea and props
export function ComposerInput({ ref, value, selection, onChangeText, onSelectionChange, onLayout, placeholder, nudge = 0 }: Props) {
	// The native-only props are not in Box's web-facing types (multiline,selection, placeholderTextColor, onChangeText, onSelectionChange, accessibilityLabel, onLayout)
	const nativeProps = { multiline: true, selection, onChangeText, onSelectionChange, onLayout, accessibilityLabel: 'Message', placeholderTextColor: t.font.annotation };
	return (
		<Box
			is='textarea'
			ref={(el) => {
				ref.current = el;
			}}
			value={value}
			placeholder={placeholder}
			color='default'
			borderWidth='none'
			width='full'
			minHeight={composerHeight.min + (nudge % 2) * 0.01}
			maxHeight={composerHeight.max}
			paddingInline={12}
			paddingBlock={16}
			fontScale='p2'
			{...nativeProps}
		/>
	);
}
