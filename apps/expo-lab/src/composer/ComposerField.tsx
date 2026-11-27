import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { ComposerContainer } from './ComposerContainer.tsx';
import { ComposerInput, composerHeight } from './ComposerInput.tsx';
import { ComposerAction, ComposerToolbar, ComposerToolbarActions, ComposerToolbarSubmit } from './ComposerToolbar.tsx';
import { composerTokens } from './tokens.ts';
import type { NativeComposer } from './useNativeComposer.ts';

export { composerHeight };

// The app is light only for now (FuselageProvider's defaultTheme)
const t = composerTokens('light');

type Props = {
	composer: NativeComposer;
	placeholder?: string;
	// Dev only: shows the field's laid out height, read from onLayout, to prove the clamp
	showHeight?: boolean;
};

export function ComposerField({ composer, placeholder = 'Message', showHeight }: Props) {
	const { text, selection, inputRef, onChangeText, onKeyPress, onSelectionChange, submit } = composer;
	const [height, setHeight] = useState<number>();
	const [nudge, setNudge] = useState(0);
	// iOS keeps the size measured for the previous text until another commit reaches the field (observed: growth and shrink lag by
	// one update after a programmatic edit); a layout-neutral style change after each text change forces that commit
	useEffect(() => {
		const t = setTimeout(() => setNudge((n) => n + 1), 50);
		return () => clearTimeout(t);
	}, [text]);
	const canSend = text.trim() !== '';

	return (
		<View style={{ gap: t.space.x4 }}>
			{showHeight && (
				<Text style={{ ...t.fontScale.c1, color: t.font.annotation }}>
					field height {height ?? '?'} px (min {composerHeight.min}, max {composerHeight.max})
				</Text>
			)}
			<ComposerContainer>
				<ComposerInput
					ref={inputRef}
					value={text}
					selection={selection}
					onChangeText={onChangeText}
					onKeyPress={onKeyPress}
					onSelectionChange={onSelectionChange}
					onLayout={(e) => setHeight(Math.round(e.nativeEvent.layout.height))}
					placeholder={placeholder}
					nudge={nudge}
				/>
				<ComposerToolbar>
					<ComposerToolbarActions />
					<ComposerToolbarSubmit>
						<ComposerAction aria-label='Send message' icon='send' disabled={!canSend} variant={canSend ? 'primary' : undefined} onClick={submit} />
					</ComposerToolbarSubmit>
				</ComposerToolbar>
			</ComposerContainer>
		</View>
	);
}
