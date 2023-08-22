import type { FontSize } from '@rocket.chat/rest-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useState } from 'react';

import { useCreateFontStyleElement } from './useCreateFontStyleElement';

export const useAdjustableFontSize = (): [FontSize, (value: FontSize) => void] => {
	const fontSizePreference = useUserPreference<FontSize>('fontSize') || '100%';
	const [fontSize, setFontSize] = useState<FontSize>(fontSizePreference);

	useCreateFontStyleElement(fontSize);

	return [fontSize, setFontSize];
};
