import type { FontSize } from '@rocket.chat/rest-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useLayoutEffect } from 'react';

import { useCreateFontStyleElement } from '../../../account/accessibility/hooks/useCreateFontStyleElement';

export const useFontStylePreference = () => {
	const fontSize = useUserPreference<FontSize>('fontSize');
	const createFontStyleElement = useCreateFontStyleElement();

	useLayoutEffect(() => {
		// Handle the edge case where the font-size preference ceases to exist: set to 100% (default)
		createFontStyleElement(fontSize || '100%');
	}, [fontSize, createFontStyleElement]);
};
