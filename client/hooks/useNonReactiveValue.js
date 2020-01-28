import { Tracker } from 'meteor/tracker';
import { useMemo } from 'react';

export const useNonReactiveValue = (getValue) => useMemo(() => Tracker.nonreactive(getValue), []);
