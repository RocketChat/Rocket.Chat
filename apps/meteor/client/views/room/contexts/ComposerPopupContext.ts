import type { ReactElement } from 'react';
import { useContext, createContext } from 'react';

export type ComposerPopupOption<T extends { _id: string; sort?: number } = { _id: string; sort?: number }> = {
	title?: string;
	getItemsFromLocal?: (filter: any) => Promise<T[]>;
	getItemsFromServer?: (filter: any) => Promise<T[]>;
	blurOnSelectItem?: boolean;
	closeOnEsc?: boolean;

	trigger?: string;
	triggerAnywhere?: boolean;
	triggerLength?: number;

	suffix?: string;
	prefix?: string;

	matchSelectorRegex?: RegExp;
	preview?: boolean;

	getValue: (item: T) => string;

	renderItem?: ({ item }: { item: T }) => ReactElement;
	disabled?: boolean;
};

export type ComposerPopupContextValue = ComposerPopupOption[];

export const ComposerPopupContext = createContext<ComposerPopupContextValue | undefined>(undefined);

export const createMessageBoxPopupConfig = <T extends { _id: string; sort?: number }>(
	partial: Omit<ComposerPopupOption<T>, 'getValue'> & Partial<Pick<ComposerPopupOption<T>, 'getValue'>>,
): ComposerPopupOption<T> => {
	return {
		blurOnSelectItem: true,
		closeOnEsc: true,
		triggerAnywhere: true,
		suffix: ' ',
		prefix: partial.prefix ?? partial.trigger ?? ' ',
		getValue: (item) => item._id,
		...partial,
	};
};

export const useComposerPopupOptions = () => {
	const composerPopupContext = useContext(ComposerPopupContext);
	if (!composerPopupContext) {
		throw new Error('useComposerPopupOptions must be used within ComposerPopupContext');
	}
	return composerPopupContext;
};
