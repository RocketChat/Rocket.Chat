import { useContext, createContext } from 'react';

import type { ComposerPopupOption } from '../../../components/AutocompletePopup/ComposerPopupOption';

export type ComposerPopupContextValue = ComposerPopupOption[];

export const ComposerPopupContext = createContext<ComposerPopupContextValue | undefined>(undefined);

export const useComposerPopupOptions = () => {
	const composerPopupContext = useContext(ComposerPopupContext);
	if (!composerPopupContext) {
		throw new Error('useComposerPopupOptions must be used within ComposerPopupContext');
	}
	return composerPopupContext;
};
