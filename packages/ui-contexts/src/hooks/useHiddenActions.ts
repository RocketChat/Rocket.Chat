import { useContext } from 'react';

import type { EmbeddingContextValue } from '../EmbeddingContext';
import { EmbeddingContext } from '../EmbeddingContext';

export const useHiddenActions = (): EmbeddingContextValue['hiddenActions'] => useContext(EmbeddingContext).hiddenActions;
