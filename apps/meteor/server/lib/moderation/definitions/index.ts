import type { Method, PathPattern } from '@rocket.chat/rest-typings';

import type { ActionThis, Options } from '../../../../app/api/server/definition';

export type ParseJsonQuery = ActionThis<Method, PathPattern, Options>['parseJsonQuery'];
