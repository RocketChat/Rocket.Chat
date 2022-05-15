import { useContext } from 'react';

import { TranslationContext, TranslationContextValue } from '../TranslationContext';

export const useLoadLanguage = (): TranslationContextValue['loadLanguage'] => useContext(TranslationContext).loadLanguage;
