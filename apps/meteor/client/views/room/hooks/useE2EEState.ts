import { useSyncExternalStore } from 'react';

import { e2e } from '../../../../app/e2e/client';
import type { E2EEState } from '../../../../app/e2e/client/E2EEState';

const subscribe = (callback: () => void): (() => void) => e2e.on('E2E_STATE_CHANGED', callback);
const getSnapshot = (): E2EEState => e2e.getState();

export const useE2EEState = (): E2EEState => useSyncExternalStore(subscribe, getSnapshot);
