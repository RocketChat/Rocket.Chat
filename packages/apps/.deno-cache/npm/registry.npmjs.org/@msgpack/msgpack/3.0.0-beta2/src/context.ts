/* eslint-disable @typescript-eslint/ban-types */

export type SplitTypes<T, U> = U extends T ? (Exclude<T, U> extends never ? T : Exclude<T, U>) : T;

export type SplitUndefined<T> = SplitTypes<T, undefined>;

export type ContextOf<ContextType> = ContextType extends undefined
  ? {}
  : {
      /**
       * Custom user-defined data, read/writable
       */
      context: ContextType;
    };
