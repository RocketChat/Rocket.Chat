import { Meteor } from 'meteor/meteor';

import { useReactiveValue } from './useReactiveValue';

export const useUserId = () => useReactiveValue(() => Meteor.userId());
