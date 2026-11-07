import { useContext } from 'react';

import type { TranslationContextValue } from '../TranslationContext.js';
import { TranslationContext } from '../TranslationContext.js';

/** @deprecated prefer `useTranslation` from `react-i18next` */
export const useTranslation = (): TranslationContextValue['translate'] => useContext(TranslationContext).translate;
