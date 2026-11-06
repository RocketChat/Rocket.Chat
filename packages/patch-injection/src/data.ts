import type { BaseFunction, PatchData } from './definition.js';

export const functions = new Map<BaseFunction, Set<PatchData<BaseFunction>>>();
export const calledFunctions = new Set<BaseFunction>();
