import { localStorage } from "./localstorage.ts";

export function withLocalStorage<T extends {}>(target: T): T & { _localStorage: typeof localStorage } {
  return Object.assign(target, { _localStorage: localStorage });
}
