import { createContext, useContext } from 'react';

const translate = (key) => key;

translate.has = () => true;

export const TranslationContext = createContext(translate);

export const useTranslation = () => useContext(TranslationContext);
