import { useContext } from 'react';

import { UiKitContext } from '../contexts/UiKitContext';

export const useUiKitContext = () => useContext(UiKitContext);
