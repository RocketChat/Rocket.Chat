import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { Roles } from '../../../app/models/client';
import { useReactiveValue } from '../../hooks/useReactiveValue';

export const useRole = (name) => useReactiveValue(useMutableCallback(() => Roles.find({ name }).fetch()[0]));