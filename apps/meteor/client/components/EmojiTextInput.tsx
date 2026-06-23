import { Box, TextInput } from '@rocket.chat/fuselage';
import { useLocalStorage, useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentProps, FocusEvent, Ref } from 'react';
import { forwardRef, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ComposerBoxPopup, fromInputElement, useComposerBoxPopup } from './AutocompletePopup';
import { createEmojiPopupConfig } from './EmojiAutocomplete/emojiPopupConfig';

type EmojiTextInputProps = ComponentProps<typeof TextInput>;

const EmojiTextInput = forwardRef(function EmojiTextInput({ disabled, onBlur, ...props }: EmojiTextInputProps, ref: Ref<HTMLInputElement>) {
	const { t } = useTranslation();
	const useEmojis = useUserPreference<boolean>('useEmojis') ?? true;
	const [recentEmojis] = useLocalStorage<string[]>('emoji.recent', []);

	const inputRef = useRef<HTMLInputElement>(null);
	const adapter = useMemo(() => fromInputElement(() => inputRef.current), []);
	const popupOptions = useMemo(
		() => (useEmojis && !disabled ? [createEmojiPopupConfig({ t, recentEmojis })] : []),
		[useEmojis, disabled, t, recentEmojis],
	);
	const popup = useComposerBoxPopup(popupOptions, adapter);
	const mergedRef = useMergedRefs(ref, inputRef, popup.callbackRef);

	const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
		popup.clear();
		onBlur?.(event);
	};

	return (
		<Box position='relative' display='flex' flexGrow={1}>
			{popup.option && (
				// preventDefault keeps the input focused while a suggestion is being clicked
				<Box
					position='absolute'
					insetBlockStart='100%'
					insetInlineStart={0}
					insetInlineEnd={0}
					mbs={4}
					zIndex={10}
					onMouseDown={(event) => event.preventDefault()}
				>
					<ComposerBoxPopup
						select={popup.select}
						items={popup.items}
						focused={popup.focused}
						title={popup.option.title}
						renderItem={popup.option.renderItem}
					/>
				</Box>
			)}
			<TextInput ref={mergedRef} disabled={disabled} flexGrow={1} onBlur={handleBlur} {...props} />
		</Box>
	);
});

export default EmojiTextInput;
