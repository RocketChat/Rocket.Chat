import { Session } from 'meteor/session';

import { useReactiveValue } from './useReactiveValue';

export const useSession = (variableName) => useReactiveValue(() => Session.get(variableName));
