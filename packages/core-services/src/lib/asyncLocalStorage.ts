import { AsyncContextStore } from './ContextStore.js';
import type { IServiceContext } from '../types/ServiceClass.js';

export const asyncLocalStorage = new AsyncContextStore<IServiceContext>();
