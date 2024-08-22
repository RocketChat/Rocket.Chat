import { useContext } from 'react';

import type { TranslationContextValue } from '../TranslationContext';
import { TranslationContext } from '../TranslationContext';

export const useLanguages = (): TranslationContextValue['languages'] => useContext(TranslationContext).languages;
