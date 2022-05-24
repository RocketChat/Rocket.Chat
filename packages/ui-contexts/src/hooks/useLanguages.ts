import { useContext } from 'react';

import { TranslationContext, TranslationContextValue } from '../TranslationContext';

export const useLanguages = (): TranslationContextValue['languages'] => useContext(TranslationContext).languages;
