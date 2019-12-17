import { createContext, useContext } from 'react';

const translate = (key) => key;
translate.has = () => true;

const defaultContextValue = {
	languages: [{
		name: 'Default',
		en: 'Default',
		key: '',
	}],
	language: '',
	translate,
};

export const TranslationContext = createContext(defaultContextValue);

export const useLanguages = () => useContext(TranslationContext).languages;
export const useLanguage = () => useContext(TranslationContext).language;
export const useTranslation = () => useContext(TranslationContext).translate;
