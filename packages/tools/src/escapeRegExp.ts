import { toString } from './toString.js';

export const escapeRegExp = (input: string): string => toString(input).replace(/[-.*+?^=!:${}()|[\]/\\]/g, '\\$&');
