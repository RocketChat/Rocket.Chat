import { createContext, useMemo, useContext } from 'react';

const translate = function(key) {
	return key;
}

translate.has =  () => true;

export const TranslationContext = createContext(translate);

export const useTranslation = () => {
	return useContext(TranslationContext);
};
