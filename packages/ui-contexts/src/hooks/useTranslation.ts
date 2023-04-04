import { useContext } from 'react';

import type { TranslationContextValue } from '../TranslationContext';
import { TranslationContext } from '../TranslationContext';

export const useTranslation = (): TranslationContextValue['translate'] => useContext(TranslationContext).translate;
