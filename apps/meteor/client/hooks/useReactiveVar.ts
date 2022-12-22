import type { ReactiveVar } from 'meteor/reactive-var';
import { useCallback } from 'react';

import { useReactiveValue } from './useReactiveValue';

/** @deprecated */
export const useReactiveVar = <T>(variable: ReactiveVar<T>): T => useReactiveValue(useCallback(() => variable.get(), [variable]));
