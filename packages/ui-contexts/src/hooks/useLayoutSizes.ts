import { useContext } from 'react';

import type { LayoutContextValue } from '../LayoutContext';
import { LayoutContext } from '../LayoutContext';

export const useLayoutSizes = (): LayoutContextValue['size'] => useContext(LayoutContext).size;
