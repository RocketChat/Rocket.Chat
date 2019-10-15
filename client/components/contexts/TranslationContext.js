import { createContext } from 'react';

const translate = function(key) {
	return key;
};

translate.has = () => true;

export const TranslationContext = createContext(translate);
