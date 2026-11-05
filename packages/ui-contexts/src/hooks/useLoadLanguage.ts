import { useContext } from 'react';

import type { TranslationContextValue } from '../TranslationContext.js';
import { TranslationContext } from '../TranslationContext.js';

export const useLoadLanguage = (): TranslationContextValue['loadLanguage'] => useContext(TranslationContext).loadLanguage;
