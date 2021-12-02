import { compileDocumentSelector } from './query';
import { compileSort } from './sort';

export const createFilterFromQuery = compileDocumentSelector;
export const createComparatorFromSort = compileSort;
export { FieldExpression, Query, Sort } from './types';
