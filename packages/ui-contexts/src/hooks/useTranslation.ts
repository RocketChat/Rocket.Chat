import { useContext } from 'react';

import type { TranslationContextValue } from '../TranslationContext';
import { TranslationContext } from '../TranslationContext';

/** @deprecated prefer `useTranslation` from `react-i18next` */
export const useTranslation = (): TranslationContextValue['translate'] => useContext(TranslationContext).translate;
