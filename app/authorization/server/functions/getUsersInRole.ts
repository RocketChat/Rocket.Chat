

import { Roles } from '../../../models/server/raw';

type Awaited<T> = T extends PromiseLike<infer U> ? U : T

export const getUsersInRole = (...args: Parameters<typeof Roles['findUsersInRole']>): Awaited<ReturnType<typeof Roles['findUsersInRole']>> => Promise.await(Roles.findUsersInRole(...args));
