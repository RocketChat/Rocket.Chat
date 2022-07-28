import { useContext } from 'react';

import { TranslationContext, TranslationContextValue } from '../TranslationContext';

export const useTranslation = (): TranslationContextValue['translate'] => useContext(TranslationContext).translate;
