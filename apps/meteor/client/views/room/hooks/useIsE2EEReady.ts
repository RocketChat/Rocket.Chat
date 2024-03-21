import { e2e } from '../../../../app/e2e/client';
import { useReactiveValue } from '../../../hooks/useReactiveValue';

export const useIsE2EEReady = (): boolean => useReactiveValue(() => e2e.isReady());
