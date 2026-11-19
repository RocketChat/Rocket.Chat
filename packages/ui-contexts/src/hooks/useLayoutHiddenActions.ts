import { useContext } from 'react';

import type { LayoutContextValue } from '../LayoutContext.js';
import { LayoutContext } from '../LayoutContext.js';

export const useLayoutHiddenActions = (): LayoutContextValue['hiddenActions'] => useContext(LayoutContext).hiddenActions;
