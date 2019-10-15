import { useContext } from 'react';

import { TranslationContext } from '../components/contexts/TranslationContext';

export const useTranslation = () => useContext(TranslationContext);
