import { useContext } from 'react';

import { LayoutContext, LayoutContextValue } from '../LayoutContext';

export const useLayout = (): LayoutContextValue => useContext(LayoutContext);
