import type { ReactElement } from 'react';
import { useContext, createContext } from 'react';

type ComposerPopupOption<T extends { _id: string } = { _id: string }> = {
	title?: string;
	getItemsFromLocal: (filter: string) => Promise<T[]>;
	getItemsFromServer: (filter: string) => Promise<T[]>;
	focused?: T | undefined;
	blurOnSelectItem?: boolean;
	closeOnEsc?: boolean;

	trigger?: string;
	triggerAnywhere?: boolean;

	suffix?: string;
	prefix?: string;

	matchSelectorRegex?: RegExp;

	getValue(item: T): string;

	renderItem?: ({ item }: { item: T }) => ReactElement;
};

export type ComposerPopupContextValue<T extends { _id: string } = { _id: string }> = ComposerPopupOption<T>[];

export const ComposerPopupContext = createContext<ComposerPopupContextValue | undefined>(undefined);

export const createMessageBoxPopupConfig = <T extends { _id: string }>(partial: ComposerPopupOption<T>): ComposerPopupOption<T> => {
	return {
		blurOnSelectItem: true,
		closeOnEsc: true,
		triggerAnywhere: true,
		suffix: ' ',
		prefix: partial.trigger ?? ' ',
		...partial,
	};
};

export const useComposerPopup = () => {
	const composerPopupContext = useContext(ComposerPopupContext);
	if (!composerPopupContext) {
		throw new Error('useComposerPopup must be used within ComposerPopupContext');
	}
	return composerPopupContext;
};
