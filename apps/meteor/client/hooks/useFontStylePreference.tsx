import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useLayoutEffect } from 'react';

import { useCreateFontStyleElement } from '../views/account/accessibility/hooks/useCreateFontStyleElement';

export const useFontStylePreference = () => {
	const fontSize = useUserPreference('fontSize', '100%');
	const createFontStyleElement = useCreateFontStyleElement();

	useLayoutEffect(() => {
		if (!fontSize) {
			return;
		}
		createFontStyleElement(fontSize);
	}, [fontSize, createFontStyleElement]);
};
