import { createContext, useContext } from 'react';

const translate = (key) => key;
translate.has = () => true;

export const TranslationContext = createContext({
	languages: [{
		name: 'Default',
		en: 'Default',
		key: '',
	}],
	language: '',
	loadLanguage: async () => {},
	translate,
});

export const useLanguages = () => useContext(TranslationContext).languages;
export const useLanguage = () => useContext(TranslationContext).language;
export const useLoadLanguage = () => useContext(TranslationContext).loadLanguage;
export const useTranslation = () => useContext(TranslationContext).translate;
