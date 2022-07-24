import { useContext } from 'react';

import { LayoutContext, LayoutContextValue } from '../LayoutContext';

export const useLayoutSizes = (): LayoutContextValue['size'] => useContext(LayoutContext).size;
