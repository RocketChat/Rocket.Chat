import { useSyncExternalStore } from 'react';

import { e2e } from '../../../lib/e2ee';

const subscribe = (callback: () => void): (() => void) => e2e.onStateChanged(callback);
const getSnapshot = () => e2e.getState();

export const useE2EEState = () => useSyncExternalStore(subscribe, getSnapshot);
