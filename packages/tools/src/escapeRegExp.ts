import { toString } from './toString';

export const escapeRegExp = (input: string): string => toString(input).replace(/[-.*+?^=!:${}()|[\]/\\]/g, '\\$&');
