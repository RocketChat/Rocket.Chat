// import { AsyncLocalStorage } from 'async_hooks';

import type { IServiceContext } from '../types/ServiceClass';
import { FakeContextStore } from './ContextStore';

// TODO Evalute again using AsyncContextStore instead of FibersContextStore in a future Meteor release (after 2.5)
export const asyncLocalStorage = new FakeContextStore<IServiceContext>();
