import { useContext } from 'react';

import { TranslationContext, TranslationContextValue } from '../TranslationContext';

export const useLanguage = (): TranslationContextValue['language'] => useContext(TranslationContext).language;
