import { compileFilter } from './filter';
import { compileSort } from './sort';

export const createPredicateFromFilter = compileFilter;
export const createComparatorFromSort = compileSort;
export { FieldExpression, Filter, Sort } from './types';
