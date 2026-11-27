import type { KeyboardEventHandler, RefObject } from 'react';
import type { LayoutChangeEvent, TextInputKeyPressEvent, TextInputSelectionChangeEvent } from 'react-native';

import MessageComposerInput from '../../../../packages/ui-composer/dist/MessageComposer/MessageComposerInput.js';
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
	onKeyPress: (event: TextInputKeyPressEvent) => void;
	onSelectionChange: (event: TextInputSelectionChangeEvent) => void;
	onLayout?: (event: LayoutChangeEvent) => void;
	placeholder?: string;
	// A layout-neutral flip that forces the commit iOS needs to re-measure after a programmatic edit
	nudge?: number;
};

export function ComposerInput({ ref, value, selection, onChangeText, onKeyPress, onSelectionChange, onLayout, placeholder, nudge = 0 }: Props) {
	// Not in Box's web-facing types
	const nativeProps = {
		multiline: true,
		selection,
		onChangeText,
		// Box types onKeyPress for the DOM; on native the TextInput passes it a TextInputKeyPressEvent
		onKeyPress: onKeyPress as unknown as KeyboardEventHandler<HTMLElement>,
		onSelectionChange,
		onLayout,
		accessibilityLabel: 'Message',
		placeholderTextColor: t.font.annotation,
	};
	return (
		<MessageComposerInput
			ref={(el) => {
				ref.current = el;
			}}
			value={value}
			placeholder={placeholder}
			// rows={1} (a web default) pins the native field to one line
			rows={undefined}
			minHeight={composerHeight.min + (nudge % 2) * 0.01}
			{...nativeProps}
		/>
	);
}
