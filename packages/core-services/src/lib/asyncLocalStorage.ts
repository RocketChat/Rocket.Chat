import { AsyncContextStore } from './ContextStore';
import type { IServiceContext } from '../types/ServiceClass';

export const asyncLocalStorage = new AsyncContextStore<IServiceContext>();
