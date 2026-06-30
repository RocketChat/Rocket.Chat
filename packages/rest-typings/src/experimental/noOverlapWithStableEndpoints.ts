/**
 * CI guard (type-level): asserts that no path declared in `ExperimentalEndpoints`
 * is also declared in the stable `Endpoints` union.
 *
 * Promoting an experimental endpoint to `/v1` means *copying* it into a stable
 * `*Endpoints` type — it must never be left declared in both unions, which
 * would silently attach a semver obligation to a path advertised as unstable.
 * If that ever happens, `tsc` (run by `yarn typecheck` in CI) fails to compile
 * this file, naming the offending path key(s) in the constraint error.
 *
 * This file declares only types — it emits no runtime code.
 */
import type { Endpoints } from '../index';
import type { ExperimentalEndpoints } from './index';

type PathsDeclaredInBothUnions = Extract<keyof ExperimentalEndpoints, keyof Endpoints>;

// `T extends never` is only satisfiable when T *is* never. If any path key is
// shared between the two unions, `PathsDeclaredInBothUnions` is that union of
// keys (not `never`) and this alias fails to type-check.
type AssertNoOverlap<T extends never> = T;

export type ExperimentalEndpointsDoNotOverlapStableEndpoints = AssertNoOverlap<PathsDeclaredInBothUnions>;
