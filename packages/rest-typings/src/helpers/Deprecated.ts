export type Deprecated<T> = (T & { warning: string }) | T;
