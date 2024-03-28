import type { IServiceContext } from '../types/ServiceClass';
import { AsyncContextStore } from './ContextStore';

export const asyncLocalStorage = new AsyncContextStore<IServiceContext>();
