// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Command line arguments parser based on
 * {@link https://github.com/minimistjs/minimist | minimist}.
 *
 * @example Usage
 * ```ts
 * import { parseArgs } from "@std/cli/parse-args";
 *
 * const args = parseArgs(Deno.args);
 * ```
 *
 * @module
 */ /** Combines recursively all intersection types and returns a new single type.
 * @internal
 */ const FLAG_REGEXP = /^(?:-(?:(?<doubleDash>-)(?<negated>no-)?)?)(?<key>.+?)(?:=(?<value>.+?))?$/s;
const LETTER_REGEXP = /[A-Za-z]/;
const NUMBER_REGEXP = /-?\d+(\.\d*)?(e-?\d+)?$/;
const HYPHEN_REGEXP = /^(-|--)[^-]/;
const VALUE_REGEXP = /=(?<value>.+)/;
const FLAG_NAME_REGEXP = /^--[^=]+$/;
const SPECIAL_CHAR_REGEXP = /\W/;
const NON_WHITESPACE_REGEXP = /\S/;
function isNumber(string) {
  return NON_WHITESPACE_REGEXP.test(string) && Number.isFinite(Number(string));
}
function setNested(object, keys, value, collect = false) {
  keys = [
    ...keys
  ];
  const key = keys.pop();
  keys.forEach((key)=>object = object[key] ??= {});
  if (collect) {
    const v = object[key];
    if (Array.isArray(v)) {
      v.push(value);
      return;
    }
    value = v ? [
      v,
      value
    ] : [
      value
    ];
  }
  object[key] = value;
}
function hasNested(object, keys) {
  for (const key of keys){
    const value = object[key];
    if (!Object.hasOwn(object, key)) return false;
    object = value;
  }
  return true;
}
function aliasIsBoolean(aliasMap, booleanSet, key) {
  const set = aliasMap.get(key);
  if (set === undefined) return false;
  for (const alias of set)if (booleanSet.has(alias)) return true;
  return false;
}
function isBooleanString(value) {
  return value === "true" || value === "false";
}
function parseBooleanString(value) {
  return value !== "false";
}
/**
 * Take a set of command line arguments, optionally with a set of options, and
 * return an object representing the flags found in the passed arguments.
 *
 * By default, any arguments starting with `-` or `--` are considered boolean
 * flags. If the argument name is followed by an equal sign (`=`) it is
 * considered a key-value pair. Any arguments which could not be parsed are
 * available in the `_` property of the returned object.
 *
 * By default, this module tries to determine the type of all arguments
 * automatically and the return type of this function will have an index
 * signature with `any` as value (`{ [x: string]: any }`).
 *
 * If the `string`, `boolean` or `collect` option is set, the return value of
 * this function will be fully typed and the index signature of the return
 * type will change to `{ [x: string]: unknown }`.
 *
 * Any arguments after `'--'` will not be parsed and will end up in `parsedArgs._`.
 *
 * Numeric-looking arguments will be returned as numbers unless `options.string`
 * or `options.boolean` is set for that argument name.
 *
 * @param args An array of command line arguments.
 * @param options Options for the parse function.
 *
 * @typeParam TArgs Type of result.
 * @typeParam TDoubleDash Used by `TArgs` for the result.
 * @typeParam TBooleans Used by `TArgs` for the result.
 * @typeParam TStrings Used by `TArgs` for the result.
 * @typeParam TCollectable Used by `TArgs` for the result.
 * @typeParam TNegatable Used by `TArgs` for the result.
 * @typeParam TDefaults Used by `TArgs` for the result.
 * @typeParam TAliases Used by `TArgs` for the result.
 * @typeParam TAliasArgNames Used by `TArgs` for the result.
 * @typeParam TAliasNames Used by `TArgs` for the result.
 *
 * @return The parsed arguments.
 *
 * @example Usage
 * ```ts
 * import { parseArgs } from "@std/cli/parse-args";
 * import { assertEquals } from "@std/assert";
 *
 * // For proper use, one should use `parseArgs(Deno.args)`
 * assertEquals(parseArgs(["--foo", "--bar=baz", "./quux.txt"]), {
 *   foo: true,
 *   bar: "baz",
 *   _: ["./quux.txt"],
 * });
 * ```
 */ export function parseArgs(args, options) {
  const { "--": doubleDash = false, alias = {}, boolean = false, default: defaults = {}, stopEarly = false, string = [], collect = [], negatable = [], unknown: unknownFn = (i)=>i } = options ?? {};
  const aliasMap = new Map();
  const booleanSet = new Set();
  const stringSet = new Set();
  const collectSet = new Set();
  const negatableSet = new Set();
  let allBools = false;
  if (alias) {
    for (const [key, value] of Object.entries(alias)){
      if (value === undefined) {
        throw new TypeError("Alias value must be defined");
      }
      const aliases = Array.isArray(value) ? value : [
        value
      ];
      aliasMap.set(key, new Set(aliases));
      aliases.forEach((alias)=>aliasMap.set(alias, new Set([
          key,
          ...aliases.filter((it)=>it !== alias)
        ])));
    }
  }
  if (boolean) {
    if (typeof boolean === "boolean") {
      allBools = boolean;
    } else {
      const booleanArgs = Array.isArray(boolean) ? boolean : [
        boolean
      ];
      for (const key of booleanArgs.filter(Boolean)){
        booleanSet.add(key);
        aliasMap.get(key)?.forEach((al)=>{
          booleanSet.add(al);
        });
      }
    }
  }
  if (string) {
    const stringArgs = Array.isArray(string) ? string : [
      string
    ];
    for (const key of stringArgs.filter(Boolean)){
      stringSet.add(key);
      aliasMap.get(key)?.forEach((al)=>stringSet.add(al));
    }
  }
  if (collect) {
    const collectArgs = Array.isArray(collect) ? collect : [
      collect
    ];
    for (const key of collectArgs.filter(Boolean)){
      collectSet.add(key);
      aliasMap.get(key)?.forEach((al)=>collectSet.add(al));
    }
  }
  if (negatable) {
    const negatableArgs = Array.isArray(negatable) ? negatable : [
      negatable
    ];
    for (const key of negatableArgs.filter(Boolean)){
      negatableSet.add(key);
      aliasMap.get(key)?.forEach((alias)=>negatableSet.add(alias));
    }
  }
  const argv = {
    _: []
  };
  function setArgument(key, value, arg, collect) {
    if (!booleanSet.has(key) && !stringSet.has(key) && !aliasMap.has(key) && !(allBools && FLAG_NAME_REGEXP.test(arg)) && unknownFn?.(arg, key, value) === false) {
      return;
    }
    if (typeof value === "string" && !stringSet.has(key)) {
      value = isNumber(value) ? Number(value) : value;
    }
    const collectable = collect && collectSet.has(key);
    setNested(argv, key.split("."), value, collectable);
    aliasMap.get(key)?.forEach((key)=>{
      setNested(argv, key.split("."), value, collectable);
    });
  }
  let notFlags = [];
  // all args after "--" are not parsed
  const index = args.indexOf("--");
  if (index !== -1) {
    notFlags = args.slice(index + 1);
    args = args.slice(0, index);
  }
  argsLoop: for(let i = 0; i < args.length; i++){
    const arg = args[i];
    const groups = arg.match(FLAG_REGEXP)?.groups;
    if (groups) {
      const { doubleDash, negated } = groups;
      let key = groups.key;
      let value = groups.value;
      if (doubleDash) {
        if (value) {
          if (booleanSet.has(key)) value = parseBooleanString(value);
          setArgument(key, value, arg, true);
          continue;
        }
        if (negated) {
          if (negatableSet.has(key)) {
            setArgument(key, false, arg, false);
            continue;
          }
          key = `no-${key}`;
        }
        const next = args[i + 1];
        if (next) {
          if (!booleanSet.has(key) && !allBools && !next.startsWith("-") && (!aliasMap.has(key) || !aliasIsBoolean(aliasMap, booleanSet, key))) {
            value = next;
            i++;
            setArgument(key, value, arg, true);
            continue;
          }
          if (isBooleanString(next)) {
            value = parseBooleanString(next);
            i++;
            setArgument(key, value, arg, true);
            continue;
          }
        }
        value = stringSet.has(key) ? "" : true;
        setArgument(key, value, arg, true);
        continue;
      }
      const letters = arg.slice(1, -1).split("");
      for (const [j, letter] of letters.entries()){
        const next = arg.slice(j + 2);
        if (next === "-") {
          setArgument(letter, next, arg, true);
          continue;
        }
        if (LETTER_REGEXP.test(letter)) {
          const groups = VALUE_REGEXP.exec(next)?.groups;
          if (groups) {
            setArgument(letter, groups.value, arg, true);
            continue argsLoop;
          }
          if (NUMBER_REGEXP.test(next)) {
            setArgument(letter, next, arg, true);
            continue argsLoop;
          }
        }
        if (letters[j + 1]?.match(SPECIAL_CHAR_REGEXP)) {
          setArgument(letter, arg.slice(j + 2), arg, true);
          continue argsLoop;
        }
        setArgument(letter, stringSet.has(letter) ? "" : true, arg, true);
      }
      key = arg.slice(-1);
      if (key === "-") continue;
      const nextArg = args[i + 1];
      if (nextArg) {
        if (!HYPHEN_REGEXP.test(nextArg) && !booleanSet.has(key) && (!aliasMap.has(key) || !aliasIsBoolean(aliasMap, booleanSet, key))) {
          setArgument(key, nextArg, arg, true);
          i++;
          continue;
        }
        if (isBooleanString(nextArg)) {
          const value = parseBooleanString(nextArg);
          setArgument(key, value, arg, true);
          i++;
          continue;
        }
      }
      setArgument(key, stringSet.has(key) ? "" : true, arg, true);
      continue;
    }
    if (unknownFn?.(arg) !== false) {
      argv._.push(stringSet.has("_") || !isNumber(arg) ? arg : Number(arg));
    }
    if (stopEarly) {
      argv._.push(...args.slice(i + 1));
      break;
    }
  }
  for (const [key, value] of Object.entries(defaults)){
    const keys = key.split(".");
    if (!hasNested(argv, keys)) {
      setNested(argv, keys, value);
      aliasMap.get(key)?.forEach((key)=>setNested(argv, key.split("."), value));
    }
  }
  for (const key of booleanSet.keys()){
    const keys = key.split(".");
    if (!hasNested(argv, keys)) {
      const value = collectSet.has(key) ? [] : false;
      setNested(argv, keys, value);
    }
  }
  for (const key of stringSet.keys()){
    const keys = key.split(".");
    if (!hasNested(argv, keys) && collectSet.has(key)) {
      setNested(argv, keys, []);
    }
  }
  if (doubleDash) {
    argv["--"] = notFlags;
  } else {
    argv._.push(...notFlags);
  }
  return argv;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvY2xpLzEuMC45L3BhcnNlX2FyZ3MudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBDb21tYW5kIGxpbmUgYXJndW1lbnRzIHBhcnNlciBiYXNlZCBvblxuICoge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9taW5pbWlzdGpzL21pbmltaXN0IHwgbWluaW1pc3R9LlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcGFyc2VBcmdzIH0gZnJvbSBcIkBzdGQvY2xpL3BhcnNlLWFyZ3NcIjtcbiAqXG4gKiBjb25zdCBhcmdzID0gcGFyc2VBcmdzKERlbm8uYXJncyk7XG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuLyoqIENvbWJpbmVzIHJlY3Vyc2l2ZWx5IGFsbCBpbnRlcnNlY3Rpb24gdHlwZXMgYW5kIHJldHVybnMgYSBuZXcgc2luZ2xlIHR5cGUuXG4gKiBAaW50ZXJuYWxcbiAqL1xudHlwZSBJZDxUUmVjb3JkPiA9IFRSZWNvcmQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICA/IFRSZWNvcmQgZXh0ZW5kcyBpbmZlciBJbmZlcnJlZFJlY29yZFxuICAgID8geyBbS2V5IGluIGtleW9mIEluZmVycmVkUmVjb3JkXTogSWQ8SW5mZXJyZWRSZWNvcmRbS2V5XT4gfVxuICA6IG5ldmVyXG4gIDogVFJlY29yZDtcblxuLyoqIENvbnZlcnRzIGEgdW5pb24gdHlwZSBgQSB8IEIgfCBDYCBpbnRvIGFuIGludGVyc2VjdGlvbiB0eXBlIGBBICYgQiAmIENgLlxuICogQGludGVybmFsXG4gKi9cbnR5cGUgVW5pb25Ub0ludGVyc2VjdGlvbjxUVmFsdWU+ID1cbiAgKFRWYWx1ZSBleHRlbmRzIHVua25vd24gPyAoYXJnczogVFZhbHVlKSA9PiB1bmtub3duIDogbmV2ZXIpIGV4dGVuZHNcbiAgICAoYXJnczogaW5mZXIgUikgPT4gdW5rbm93biA/IFIgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA/IFIgOiBuZXZlclxuICAgIDogbmV2ZXI7XG5cbi8qKiBAaW50ZXJuYWwgKi9cbnR5cGUgQm9vbGVhblR5cGUgPSBib29sZWFuIHwgc3RyaW5nIHwgdW5kZWZpbmVkO1xuLyoqIEBpbnRlcm5hbCAqL1xudHlwZSBTdHJpbmdUeXBlID0gc3RyaW5nIHwgdW5kZWZpbmVkO1xuLyoqIEBpbnRlcm5hbCAqL1xudHlwZSBBcmdUeXBlID0gU3RyaW5nVHlwZSB8IEJvb2xlYW5UeXBlO1xuXG4vKiogQGludGVybmFsICovXG50eXBlIENvbGxlY3RhYmxlID0gc3RyaW5nIHwgdW5kZWZpbmVkO1xuLyoqIEBpbnRlcm5hbCAqL1xudHlwZSBOZWdhdGFibGUgPSBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbnR5cGUgVXNlVHlwZXM8XG4gIFRCb29sZWFucyBleHRlbmRzIEJvb2xlYW5UeXBlLFxuICBUU3RyaW5ncyBleHRlbmRzIFN0cmluZ1R5cGUsXG4gIFRDb2xsZWN0YWJsZSBleHRlbmRzIENvbGxlY3RhYmxlLFxuPiA9IHVuZGVmaW5lZCBleHRlbmRzIChcbiAgJiAoZmFsc2UgZXh0ZW5kcyBUQm9vbGVhbnMgPyB1bmRlZmluZWQgOiBUQm9vbGVhbnMpXG4gICYgVENvbGxlY3RhYmxlXG4gICYgVFN0cmluZ3NcbikgPyBmYWxzZVxuICA6IHRydWU7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHJlY29yZCB3aXRoIGFsbCBhdmFpbGFibGUgZmxhZ3Mgd2l0aCB0aGUgY29ycmVzcG9uZGluZyB0eXBlIGFuZFxuICogZGVmYXVsdCB0eXBlLlxuICogQGludGVybmFsXG4gKi9cbnR5cGUgVmFsdWVzPFxuICBUQm9vbGVhbnMgZXh0ZW5kcyBCb29sZWFuVHlwZSxcbiAgVFN0cmluZ3MgZXh0ZW5kcyBTdHJpbmdUeXBlLFxuICBUQ29sbGVjdGFibGUgZXh0ZW5kcyBDb2xsZWN0YWJsZSxcbiAgVE5lZ2F0YWJsZSBleHRlbmRzIE5lZ2F0YWJsZSxcbiAgVERlZmF1bHQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZCxcbiAgVEFsaWFzZXMgZXh0ZW5kcyBBbGlhc2VzIHwgdW5kZWZpbmVkLFxuPiA9IFVzZVR5cGVzPFRCb29sZWFucywgVFN0cmluZ3MsIFRDb2xsZWN0YWJsZT4gZXh0ZW5kcyB0cnVlID9cbiAgICAmIFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gICAgJiBBZGRBbGlhc2VzPFxuICAgICAgU3ByZWFkRGVmYXVsdHM8XG4gICAgICAgICYgQ29sbGVjdFZhbHVlczxUU3RyaW5ncywgc3RyaW5nLCBUQ29sbGVjdGFibGUsIFROZWdhdGFibGU+XG4gICAgICAgICYgUmVjdXJzaXZlUmVxdWlyZWQ8Q29sbGVjdFZhbHVlczxUQm9vbGVhbnMsIGJvb2xlYW4sIFRDb2xsZWN0YWJsZT4+XG4gICAgICAgICYgQ29sbGVjdFVua25vd25WYWx1ZXM8XG4gICAgICAgICAgVEJvb2xlYW5zLFxuICAgICAgICAgIFRTdHJpbmdzLFxuICAgICAgICAgIFRDb2xsZWN0YWJsZSxcbiAgICAgICAgICBUTmVnYXRhYmxlXG4gICAgICAgID4sXG4gICAgICAgIERlZG90UmVjb3JkPFREZWZhdWx0PlxuICAgICAgPixcbiAgICAgIFRBbGlhc2VzXG4gICAgPlxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICA6IFJlY29yZDxzdHJpbmcsIGFueT47XG5cbi8qKiBAaW50ZXJuYWwgKi9cbnR5cGUgQWxpYXNlczxUQXJnTmFtZXMgPSBzdHJpbmcsIFRBbGlhc05hbWVzIGV4dGVuZHMgc3RyaW5nID0gc3RyaW5nPiA9IFBhcnRpYWw8XG4gIFJlY29yZDxFeHRyYWN0PFRBcmdOYW1lcywgc3RyaW5nPiwgVEFsaWFzTmFtZXMgfCBSZWFkb25seUFycmF5PFRBbGlhc05hbWVzPj5cbj47XG5cbnR5cGUgQWRkQWxpYXNlczxcbiAgVEFyZ3MsXG4gIFRBbGlhc2VzIGV4dGVuZHMgQWxpYXNlcyB8IHVuZGVmaW5lZCxcbj4gPSB7XG4gIFtUQXJnTmFtZSBpbiBrZXlvZiBUQXJncyBhcyBBbGlhc05hbWVzPFRBcmdOYW1lLCBUQWxpYXNlcz5dOiBUQXJnc1tUQXJnTmFtZV07XG59O1xuXG50eXBlIEFsaWFzTmFtZXM8XG4gIFRBcmdOYW1lLFxuICBUQWxpYXNlcyBleHRlbmRzIEFsaWFzZXMgfCB1bmRlZmluZWQsXG4+ID0gVEFyZ05hbWUgZXh0ZW5kcyBrZXlvZiBUQWxpYXNlc1xuICA/IHN0cmluZyBleHRlbmRzIFRBbGlhc2VzW1RBcmdOYW1lXSA/IFRBcmdOYW1lXG4gIDogVEFsaWFzZXNbVEFyZ05hbWVdIGV4dGVuZHMgc3RyaW5nID8gVEFyZ05hbWUgfCBUQWxpYXNlc1tUQXJnTmFtZV1cbiAgOiBUQWxpYXNlc1tUQXJnTmFtZV0gZXh0ZW5kcyBBcnJheTxzdHJpbmc+XG4gICAgPyBUQXJnTmFtZSB8IFRBbGlhc2VzW1RBcmdOYW1lXVtudW1iZXJdXG4gIDogVEFyZ05hbWVcbiAgOiBUQXJnTmFtZTtcblxuLyoqXG4gKiBTcHJlYWRzIGFsbCBkZWZhdWx0IHZhbHVlcyBvZiBSZWNvcmQgYFREZWZhdWx0c2AgaW50byBSZWNvcmQgYFRBcmdzYFxuICogYW5kIG1ha2VzIGRlZmF1bHQgdmFsdWVzIHJlcXVpcmVkLlxuICpcbiAqICoqRXhhbXBsZToqKlxuICogYFNwcmVhZFZhbHVlczx7IGZvbz86IGJvb2xlYW4sIGJhcj86IG51bWJlciB9LCB7IGZvbzogbnVtYmVyIH0+YFxuICpcbiAqICoqUmVzdWx0OioqIGB7IGZvbzogYm9vbGVhbiB8IG51bWJlciwgYmFyPzogbnVtYmVyIH1gXG4gKi9cbnR5cGUgU3ByZWFkRGVmYXVsdHM8VEFyZ3MsIFREZWZhdWx0cz4gPSBURGVmYXVsdHMgZXh0ZW5kcyB1bmRlZmluZWQgPyBUQXJnc1xuICA6IFRBcmdzIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gP1xuICAgICAgJiBPbWl0PFRBcmdzLCBrZXlvZiBURGVmYXVsdHM+XG4gICAgICAmIHtcbiAgICAgICAgW0RlZmF1bHQgaW4ga2V5b2YgVERlZmF1bHRzXTogRGVmYXVsdCBleHRlbmRzIGtleW9mIFRBcmdzXG4gICAgICAgICAgPyAoVEFyZ3NbRGVmYXVsdF0gJiBURGVmYXVsdHNbRGVmYXVsdF0gfCBURGVmYXVsdHNbRGVmYXVsdF0pIGV4dGVuZHNcbiAgICAgICAgICAgIFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gICAgICAgICAgICA/IE5vbk51bGxhYmxlPFNwcmVhZERlZmF1bHRzPFRBcmdzW0RlZmF1bHRdLCBURGVmYXVsdHNbRGVmYXVsdF0+PlxuICAgICAgICAgIDogVERlZmF1bHRzW0RlZmF1bHRdIHwgTm9uTnVsbGFibGU8VEFyZ3NbRGVmYXVsdF0+XG4gICAgICAgICAgOiB1bmtub3duO1xuICAgICAgfVxuICA6IG5ldmVyO1xuXG4vKipcbiAqIERlZmluZXMgdGhlIFJlY29yZCBmb3IgdGhlIGBkZWZhdWx0YCBvcHRpb24gdG8gYWRkXG4gKiBhdXRvLXN1Z2dlc3Rpb24gc3VwcG9ydCBmb3IgSURFJ3MuXG4gKiBAaW50ZXJuYWxcbiAqL1xudHlwZSBEZWZhdWx0czxUQm9vbGVhbnMgZXh0ZW5kcyBCb29sZWFuVHlwZSwgVFN0cmluZ3MgZXh0ZW5kcyBTdHJpbmdUeXBlPiA9IElkPFxuICBVbmlvblRvSW50ZXJzZWN0aW9uPFxuICAgICYgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgICAvLyBEZWRvdHRlZCBhdXRvIHN1Z2dlc3Rpb25zOiB7IGZvbzogeyBiYXI6IHVua25vd24gfSB9XG4gICAgJiBNYXBUeXBlczxUU3RyaW5ncywgdW5rbm93bj5cbiAgICAmIE1hcFR5cGVzPFRCb29sZWFucywgdW5rbm93bj5cbiAgICAvLyBGbGF0IGF1dG8gc3VnZ2VzdGlvbnM6IHsgXCJmb28uYmFyXCI6IHVua25vd24gfVxuICAgICYgTWFwRGVmYXVsdHM8VEJvb2xlYW5zPlxuICAgICYgTWFwRGVmYXVsdHM8VFN0cmluZ3M+XG4gID5cbj47XG5cbnR5cGUgTWFwRGVmYXVsdHM8VEFyZ05hbWVzIGV4dGVuZHMgQXJnVHlwZT4gPSBQYXJ0aWFsPFxuICBSZWNvcmQ8VEFyZ05hbWVzIGV4dGVuZHMgc3RyaW5nID8gVEFyZ05hbWVzIDogc3RyaW5nLCB1bmtub3duPlxuPjtcblxudHlwZSBSZWN1cnNpdmVSZXF1aXJlZDxUUmVjb3JkPiA9IFRSZWNvcmQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA/IHtcbiAgICBbS2V5IGluIGtleW9mIFRSZWNvcmRdLT86IFJlY3Vyc2l2ZVJlcXVpcmVkPFRSZWNvcmRbS2V5XT47XG4gIH1cbiAgOiBUUmVjb3JkO1xuXG4vKiogU2FtZSBhcyBgTWFwVHlwZXNgIGJ1dCBhbHNvIHN1cHBvcnRzIGNvbGxlY3RhYmxlIG9wdGlvbnMuICovXG50eXBlIENvbGxlY3RWYWx1ZXM8XG4gIFRBcmdOYW1lcyBleHRlbmRzIEFyZ1R5cGUsXG4gIFRUeXBlLFxuICBUQ29sbGVjdGFibGUgZXh0ZW5kcyBDb2xsZWN0YWJsZSxcbiAgVE5lZ2F0YWJsZSBleHRlbmRzIE5lZ2F0YWJsZSA9IHVuZGVmaW5lZCxcbj4gPSBVbmlvblRvSW50ZXJzZWN0aW9uPFxuICBFeHRyYWN0PFRBcmdOYW1lcywgVENvbGxlY3RhYmxlPiBleHRlbmRzIHN0cmluZyA/XG4gICAgICAmIChFeGNsdWRlPFRBcmdOYW1lcywgVENvbGxlY3RhYmxlPiBleHRlbmRzIG5ldmVyID8gUmVjb3JkPG5ldmVyLCBuZXZlcj5cbiAgICAgICAgOiBNYXBUeXBlczxFeGNsdWRlPFRBcmdOYW1lcywgVENvbGxlY3RhYmxlPiwgVFR5cGUsIFROZWdhdGFibGU+KVxuICAgICAgJiAoRXh0cmFjdDxUQXJnTmFtZXMsIFRDb2xsZWN0YWJsZT4gZXh0ZW5kcyBuZXZlciA/IFJlY29yZDxuZXZlciwgbmV2ZXI+XG4gICAgICAgIDogUmVjdXJzaXZlUmVxdWlyZWQ8XG4gICAgICAgICAgTWFwVHlwZXM8RXh0cmFjdDxUQXJnTmFtZXMsIFRDb2xsZWN0YWJsZT4sIEFycmF5PFRUeXBlPiwgVE5lZ2F0YWJsZT5cbiAgICAgICAgPilcbiAgICA6IE1hcFR5cGVzPFRBcmdOYW1lcywgVFR5cGUsIFROZWdhdGFibGU+XG4+O1xuXG4vKiogU2FtZSBhcyBgUmVjb3JkYCBidXQgYWxzbyBzdXBwb3J0cyBkb3R0ZWQgYW5kIG5lZ2F0YWJsZSBvcHRpb25zLiAqL1xudHlwZSBNYXBUeXBlczxcbiAgVEFyZ05hbWVzIGV4dGVuZHMgQXJnVHlwZSxcbiAgVFR5cGUsXG4gIFROZWdhdGFibGUgZXh0ZW5kcyBOZWdhdGFibGUgPSB1bmRlZmluZWQsXG4+ID0gdW5kZWZpbmVkIGV4dGVuZHMgVEFyZ05hbWVzID8gUmVjb3JkPG5ldmVyLCBuZXZlcj5cbiAgOiBUQXJnTmFtZXMgZXh0ZW5kcyBgJHtpbmZlciBOYW1lfS4ke2luZmVyIFJlc3R9YCA/IHtcbiAgICAgIFtLZXkgaW4gTmFtZV0/OiBNYXBUeXBlczxcbiAgICAgICAgUmVzdCxcbiAgICAgICAgVFR5cGUsXG4gICAgICAgIFROZWdhdGFibGUgZXh0ZW5kcyBgJHtOYW1lfS4ke2luZmVyIE5lZ2F0ZX1gID8gTmVnYXRlIDogdW5kZWZpbmVkXG4gICAgICA+O1xuICAgIH1cbiAgOiBUQXJnTmFtZXMgZXh0ZW5kcyBzdHJpbmcgPyBQYXJ0aWFsPFxuICAgICAgUmVjb3JkPFRBcmdOYW1lcywgVE5lZ2F0YWJsZSBleHRlbmRzIFRBcmdOYW1lcyA/IFRUeXBlIHwgZmFsc2UgOiBUVHlwZT5cbiAgICA+XG4gIDogUmVjb3JkPG5ldmVyLCBuZXZlcj47XG5cbnR5cGUgQ29sbGVjdFVua25vd25WYWx1ZXM8XG4gIFRCb29sZWFucyBleHRlbmRzIEJvb2xlYW5UeXBlLFxuICBUU3RyaW5ncyBleHRlbmRzIFN0cmluZ1R5cGUsXG4gIFRDb2xsZWN0YWJsZSBleHRlbmRzIENvbGxlY3RhYmxlLFxuICBUTmVnYXRhYmxlIGV4dGVuZHMgTmVnYXRhYmxlLFxuPiA9IFVuaW9uVG9JbnRlcnNlY3Rpb248XG4gIFRDb2xsZWN0YWJsZSBleHRlbmRzIFRCb29sZWFucyAmIFRTdHJpbmdzID8gUmVjb3JkPG5ldmVyLCBuZXZlcj5cbiAgICA6IERlZG90UmVjb3JkPFxuICAgICAgLy8gVW5rbm93biBjb2xsZWN0YWJsZSAmIG5vbi1uZWdhdGFibGUgYXJncy5cbiAgICAgICYgUmVjb3JkPFxuICAgICAgICBFeGNsdWRlPFxuICAgICAgICAgIEV4dHJhY3Q8RXhjbHVkZTxUQ29sbGVjdGFibGUsIFROZWdhdGFibGU+LCBzdHJpbmc+LFxuICAgICAgICAgIEV4dHJhY3Q8VFN0cmluZ3MgfCBUQm9vbGVhbnMsIHN0cmluZz5cbiAgICAgICAgPixcbiAgICAgICAgQXJyYXk8dW5rbm93bj5cbiAgICAgID5cbiAgICAgIC8vIFVua25vd24gY29sbGVjdGFibGUgJiBuZWdhdGFibGUgYXJncy5cbiAgICAgICYgUmVjb3JkPFxuICAgICAgICBFeGNsdWRlPFxuICAgICAgICAgIEV4dHJhY3Q8RXh0cmFjdDxUQ29sbGVjdGFibGUsIFROZWdhdGFibGU+LCBzdHJpbmc+LFxuICAgICAgICAgIEV4dHJhY3Q8VFN0cmluZ3MgfCBUQm9vbGVhbnMsIHN0cmluZz5cbiAgICAgICAgPixcbiAgICAgICAgQXJyYXk8dW5rbm93bj4gfCBmYWxzZVxuICAgICAgPlxuICAgID5cbj47XG5cbi8qKiBDb252ZXJ0cyBgeyBcImZvby5iYXIuYmF6XCI6IHVua25vd24gfWAgaW50byBgeyBmb286IHsgYmFyOiB7IGJhejogdW5rbm93biB9IH0gfWAuICovXG50eXBlIERlZG90UmVjb3JkPFRSZWNvcmQ+ID0gUmVjb3JkPHN0cmluZywgdW5rbm93bj4gZXh0ZW5kcyBUUmVjb3JkID8gVFJlY29yZFxuICA6IFRSZWNvcmQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA/IFVuaW9uVG9JbnRlcnNlY3Rpb248XG4gICAgICBWYWx1ZU9mPFxuICAgICAgICB7XG4gICAgICAgICAgW0tleSBpbiBrZXlvZiBUUmVjb3JkXTogS2V5IGV4dGVuZHMgc3RyaW5nID8gRGVkb3Q8S2V5LCBUUmVjb3JkW0tleV0+XG4gICAgICAgICAgICA6IG5ldmVyO1xuICAgICAgICB9XG4gICAgICA+XG4gICAgPlxuICA6IFRSZWNvcmQ7XG5cbnR5cGUgRGVkb3Q8VEtleSBleHRlbmRzIHN0cmluZywgVFZhbHVlPiA9IFRLZXkgZXh0ZW5kc1xuICBgJHtpbmZlciBOYW1lfS4ke2luZmVyIFJlc3R9YCA/IHsgW0tleSBpbiBOYW1lXTogRGVkb3Q8UmVzdCwgVFZhbHVlPiB9XG4gIDogeyBbS2V5IGluIFRLZXldOiBUVmFsdWUgfTtcblxudHlwZSBWYWx1ZU9mPFRWYWx1ZT4gPSBUVmFsdWVba2V5b2YgVFZhbHVlXTtcblxuLyoqIFRoZSB2YWx1ZSByZXR1cm5lZCBmcm9tIHtAbGlua2NvZGUgcGFyc2VBcmdzfS4gKi9cbmV4cG9ydCB0eXBlIEFyZ3M8XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIFRBcmdzIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxuICBURG91YmxlRGFzaCBleHRlbmRzIGJvb2xlYW4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXG4+ID0gSWQ8XG4gICYgVEFyZ3NcbiAgJiB7XG4gICAgLyoqIENvbnRhaW5zIGFsbCB0aGUgYXJndW1lbnRzIHRoYXQgZGlkbid0IGhhdmUgYW4gb3B0aW9uIGFzc29jaWF0ZWQgd2l0aFxuICAgICAqIHRoZW0uICovXG4gICAgXzogQXJyYXk8c3RyaW5nIHwgbnVtYmVyPjtcbiAgfVxuICAmIChib29sZWFuIGV4dGVuZHMgVERvdWJsZURhc2ggPyBEb3VibGVEYXNoXG4gICAgOiB0cnVlIGV4dGVuZHMgVERvdWJsZURhc2ggPyBSZXF1aXJlZDxEb3VibGVEYXNoPlxuICAgIDogUmVjb3JkPG5ldmVyLCBuZXZlcj4pXG4+O1xuXG4vKiogQGludGVybmFsICovXG50eXBlIERvdWJsZURhc2ggPSB7XG4gIC8qKiBDb250YWlucyBhbGwgdGhlIGFyZ3VtZW50cyB0aGF0IGFwcGVhciBhZnRlciB0aGUgZG91YmxlIGRhc2g6IFwiLS1cIi4gKi9cbiAgXCItLVwiPzogQXJyYXk8c3RyaW5nPjtcbn07XG5cbi8qKiBPcHRpb25zIGZvciB7QGxpbmtjb2RlIHBhcnNlQXJnc30uICovXG5leHBvcnQgaW50ZXJmYWNlIFBhcnNlT3B0aW9uczxcbiAgVEJvb2xlYW5zIGV4dGVuZHMgQm9vbGVhblR5cGUgPSBCb29sZWFuVHlwZSxcbiAgVFN0cmluZ3MgZXh0ZW5kcyBTdHJpbmdUeXBlID0gU3RyaW5nVHlwZSxcbiAgVENvbGxlY3RhYmxlIGV4dGVuZHMgQ29sbGVjdGFibGUgPSBDb2xsZWN0YWJsZSxcbiAgVE5lZ2F0YWJsZSBleHRlbmRzIE5lZ2F0YWJsZSA9IE5lZ2F0YWJsZSxcbiAgVERlZmF1bHQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZCA9XG4gICAgfCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICAgIHwgdW5kZWZpbmVkLFxuICBUQWxpYXNlcyBleHRlbmRzIEFsaWFzZXMgfCB1bmRlZmluZWQgPSBBbGlhc2VzIHwgdW5kZWZpbmVkLFxuICBURG91YmxlRGFzaCBleHRlbmRzIGJvb2xlYW4gfCB1bmRlZmluZWQgPSBib29sZWFuIHwgdW5kZWZpbmVkLFxuPiB7XG4gIC8qKlxuICAgKiBXaGVuIGB0cnVlYCwgcG9wdWxhdGUgdGhlIHJlc3VsdCBgX2Agd2l0aCBldmVyeXRoaW5nIGJlZm9yZSB0aGUgYC0tYCBhbmRcbiAgICogdGhlIHJlc3VsdCBgWyctLSddYCB3aXRoIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGAtLWAuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtmYWxzZX1cbiAgICpcbiAgICogQGV4YW1wbGUgRG91YmxlIGRhc2ggb3B0aW9uIGlzIGZhbHNlXG4gICAqIGBgYHRzXG4gICAqIC8vICQgZGVubyBydW4gZXhhbXBsZS50cyAtLSBhIGFyZzFcbiAgICogaW1wb3J0IHsgcGFyc2VBcmdzIH0gZnJvbSBcIkBzdGQvY2xpL3BhcnNlLWFyZ3NcIjtcbiAgICogY29uc3QgYXJncyA9IHBhcnNlQXJncyhEZW5vLmFyZ3MsIHsgXCItLVwiOiBmYWxzZSB9KTsgLy8gYXJncyBlcXVhbHMgeyBfOiBbIFwiYVwiLCBcImFyZzFcIiBdIH1cbiAgICogYGBgXG4gICAqXG4gICAqICBAZXhhbXBsZSBEb3VibGUgZGFzaCBvcHRpb24gaXMgdHJ1ZVxuICAgKiBgYGB0c1xuICAgKiAvLyAkIGRlbm8gcnVuIGV4YW1wbGUudHMgLS0gYSBhcmcxXG4gICAqIGltcG9ydCB7IHBhcnNlQXJncyB9IGZyb20gXCJAc3RkL2NsaS9wYXJzZS1hcmdzXCI7XG4gICAqIGNvbnN0IGFyZ3MgPSBwYXJzZUFyZ3MoRGVuby5hcmdzLCB7IFwiLS1cIjogdHJ1ZSB9KTsgLy8gYXJncyBlcXVhbHMgeyBfOiBbXSwgLS06IFsgXCJhXCIsIFwiYXJnMVwiIF0gfVxuICAgKiBgYGBcbiAgICovXG4gIFwiLS1cIj86IFREb3VibGVEYXNoO1xuXG4gIC8qKlxuICAgKiBBbiBvYmplY3QgbWFwcGluZyBzdHJpbmcgbmFtZXMgdG8gc3RyaW5ncyBvciBhcnJheXMgb2Ygc3RyaW5nIGFyZ3VtZW50XG4gICAqIG5hbWVzIHRvIHVzZSBhcyBhbGlhc2VzLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7e319XG4gICAqL1xuICBhbGlhcz86IFRBbGlhc2VzO1xuXG4gIC8qKlxuICAgKiBBIGJvb2xlYW4sIHN0cmluZyBvciBhcnJheSBvZiBzdHJpbmdzIHRvIGFsd2F5cyB0cmVhdCBhcyBib29sZWFucy4gSWZcbiAgICogYHRydWVgIHdpbGwgdHJlYXQgYWxsIGRvdWJsZSBoeXBoZW5hdGVkIGFyZ3VtZW50cyB3aXRob3V0IGVxdWFsIHNpZ25zIGFzXG4gICAqIGBib29sZWFuYCAoZS5nLiBhZmZlY3RzIGAtLWZvb2AsIG5vdCBgLWZgIG9yIGAtLWZvbz1iYXJgKS5cbiAgICogIEFsbCBgYm9vbGVhbmAgYXJndW1lbnRzIHdpbGwgYmUgc2V0IHRvIGBmYWxzZWAgYnkgZGVmYXVsdC5cbiAgICpcbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgYm9vbGVhbj86IFRCb29sZWFucyB8IFJlYWRvbmx5QXJyYXk8RXh0cmFjdDxUQm9vbGVhbnMsIHN0cmluZz4+O1xuXG4gIC8qKlxuICAgKiBBbiBvYmplY3QgbWFwcGluZyBzdHJpbmcgYXJndW1lbnQgbmFtZXMgdG8gZGVmYXVsdCB2YWx1ZXMuXG4gICAqXG4gICAqIEBkZWZhdWx0IHt7fX1cbiAgICovXG4gIGRlZmF1bHQ/OiBURGVmYXVsdCAmIERlZmF1bHRzPFRCb29sZWFucywgVFN0cmluZ3M+O1xuXG4gIC8qKlxuICAgKiBXaGVuIGB0cnVlYCwgcG9wdWxhdGUgdGhlIHJlc3VsdCBgX2Agd2l0aCBldmVyeXRoaW5nIGFmdGVyIHRoZSBmaXJzdFxuICAgKiBub24tb3B0aW9uLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7ZmFsc2V9XG4gICAqL1xuICBzdG9wRWFybHk/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBBIHN0cmluZyBvciBhcnJheSBvZiBzdHJpbmdzIGFyZ3VtZW50IG5hbWVzIHRvIGFsd2F5cyB0cmVhdCBhcyBzdHJpbmdzLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7W119XG4gICAqL1xuICBzdHJpbmc/OiBUU3RyaW5ncyB8IFJlYWRvbmx5QXJyYXk8RXh0cmFjdDxUU3RyaW5ncywgc3RyaW5nPj47XG5cbiAgLyoqXG4gICAqIEEgc3RyaW5nIG9yIGFycmF5IG9mIHN0cmluZ3MgYXJndW1lbnQgbmFtZXMgdG8gYWx3YXlzIHRyZWF0IGFzIGFycmF5cy5cbiAgICogQ29sbGVjdGFibGUgb3B0aW9ucyBjYW4gYmUgdXNlZCBtdWx0aXBsZSB0aW1lcy4gQWxsIHZhbHVlcyB3aWxsIGJlXG4gICAqIGNvbGxlY3RlZCBpbnRvIG9uZSBhcnJheS4gSWYgYSBub24tY29sbGVjdGFibGUgb3B0aW9uIGlzIHVzZWQgbXVsdGlwbGVcbiAgICogdGltZXMsIHRoZSBsYXN0IHZhbHVlIGlzIHVzZWQuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtbXX1cbiAgICovXG4gIGNvbGxlY3Q/OiBUQ29sbGVjdGFibGUgfCBSZWFkb25seUFycmF5PEV4dHJhY3Q8VENvbGxlY3RhYmxlLCBzdHJpbmc+PjtcblxuICAvKipcbiAgICogQSBzdHJpbmcgb3IgYXJyYXkgb2Ygc3RyaW5ncyBhcmd1bWVudCBuYW1lcyB3aGljaCBjYW4gYmUgbmVnYXRlZFxuICAgKiBieSBwcmVmaXhpbmcgdGhlbSB3aXRoIGAtLW5vLWAsIGxpa2UgYC0tbm8tY29uZmlnYC5cbiAgICpcbiAgICogQGRlZmF1bHQge1tdfVxuICAgKi9cbiAgbmVnYXRhYmxlPzogVE5lZ2F0YWJsZSB8IFJlYWRvbmx5QXJyYXk8RXh0cmFjdDxUTmVnYXRhYmxlLCBzdHJpbmc+PjtcblxuICAvKipcbiAgICogQSBmdW5jdGlvbiB3aGljaCBpcyBpbnZva2VkIHdpdGggYSBjb21tYW5kIGxpbmUgcGFyYW1ldGVyIG5vdCBkZWZpbmVkIGluXG4gICAqIHRoZSBgb3B0aW9uc2AgY29uZmlndXJhdGlvbiBvYmplY3QuIElmIHRoZSBmdW5jdGlvbiByZXR1cm5zIGBmYWxzZWAsIHRoZVxuICAgKiB1bmtub3duIG9wdGlvbiBpcyBub3QgYWRkZWQgdG8gYHBhcnNlZEFyZ3NgLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7dW5rbm93bn1cbiAgICovXG4gIHVua25vd24/OiAoYXJnOiBzdHJpbmcsIGtleT86IHN0cmluZywgdmFsdWU/OiB1bmtub3duKSA9PiB1bmtub3duO1xufVxuXG5pbnRlcmZhY2UgTmVzdGVkTWFwcGluZyB7XG4gIFtrZXk6IHN0cmluZ106IE5lc3RlZE1hcHBpbmcgfCB1bmtub3duO1xufVxuXG5jb25zdCBGTEFHX1JFR0VYUCA9XG4gIC9eKD86LSg/Oig/PGRvdWJsZURhc2g+LSkoPzxuZWdhdGVkPm5vLSk/KT8pKD88a2V5Pi4rPykoPzo9KD88dmFsdWU+Lis/KSk/JC9zO1xuY29uc3QgTEVUVEVSX1JFR0VYUCA9IC9bQS1aYS16XS87XG5jb25zdCBOVU1CRVJfUkVHRVhQID0gLy0/XFxkKyhcXC5cXGQqKT8oZS0/XFxkKyk/JC87XG5jb25zdCBIWVBIRU5fUkVHRVhQID0gL14oLXwtLSlbXi1dLztcbmNvbnN0IFZBTFVFX1JFR0VYUCA9IC89KD88dmFsdWU+LispLztcbmNvbnN0IEZMQUdfTkFNRV9SRUdFWFAgPSAvXi0tW149XSskLztcbmNvbnN0IFNQRUNJQUxfQ0hBUl9SRUdFWFAgPSAvXFxXLztcblxuY29uc3QgTk9OX1dISVRFU1BBQ0VfUkVHRVhQID0gL1xcUy87XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKHN0cmluZzogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBOT05fV0hJVEVTUEFDRV9SRUdFWFAudGVzdChzdHJpbmcpICYmIE51bWJlci5pc0Zpbml0ZShOdW1iZXIoc3RyaW5nKSk7XG59XG5cbmZ1bmN0aW9uIHNldE5lc3RlZChcbiAgb2JqZWN0OiBOZXN0ZWRNYXBwaW5nLFxuICBrZXlzOiBzdHJpbmdbXSxcbiAgdmFsdWU6IHVua25vd24sXG4gIGNvbGxlY3QgPSBmYWxzZSxcbikge1xuICBrZXlzID0gWy4uLmtleXNdO1xuICBjb25zdCBrZXkgPSBrZXlzLnBvcCgpITtcblxuICBrZXlzLmZvckVhY2goKGtleSkgPT4gb2JqZWN0ID0gKG9iamVjdFtrZXldID8/PSB7fSkgYXMgTmVzdGVkTWFwcGluZyk7XG5cbiAgaWYgKGNvbGxlY3QpIHtcbiAgICBjb25zdCB2ID0gb2JqZWN0W2tleV07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIHYucHVzaCh2YWx1ZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFsdWUgPSB2ID8gW3YsIHZhbHVlXSA6IFt2YWx1ZV07XG4gIH1cblxuICBvYmplY3Rba2V5XSA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBoYXNOZXN0ZWQob2JqZWN0OiBOZXN0ZWRNYXBwaW5nLCBrZXlzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgY29uc3QgdmFsdWUgPSBvYmplY3Rba2V5XTtcbiAgICBpZiAoIU9iamVjdC5oYXNPd24ob2JqZWN0LCBrZXkpKSByZXR1cm4gZmFsc2U7XG4gICAgb2JqZWN0ID0gdmFsdWUgYXMgTmVzdGVkTWFwcGluZztcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gYWxpYXNJc0Jvb2xlYW4oXG4gIGFsaWFzTWFwOiBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4sXG4gIGJvb2xlYW5TZXQ6IFNldDxzdHJpbmc+LFxuICBrZXk6IHN0cmluZyxcbik6IGJvb2xlYW4ge1xuICBjb25zdCBzZXQgPSBhbGlhc01hcC5nZXQoa2V5KTtcbiAgaWYgKHNldCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7XG4gIGZvciAoY29uc3QgYWxpYXMgb2Ygc2V0KSBpZiAoYm9vbGVhblNldC5oYXMoYWxpYXMpKSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc0Jvb2xlYW5TdHJpbmcodmFsdWU6IHN0cmluZykge1xuICByZXR1cm4gdmFsdWUgPT09IFwidHJ1ZVwiIHx8IHZhbHVlID09PSBcImZhbHNlXCI7XG59XG5cbmZ1bmN0aW9uIHBhcnNlQm9vbGVhblN0cmluZyh2YWx1ZTogdW5rbm93bikge1xuICByZXR1cm4gdmFsdWUgIT09IFwiZmFsc2VcIjtcbn1cblxuLyoqXG4gKiBUYWtlIGEgc2V0IG9mIGNvbW1hbmQgbGluZSBhcmd1bWVudHMsIG9wdGlvbmFsbHkgd2l0aCBhIHNldCBvZiBvcHRpb25zLCBhbmRcbiAqIHJldHVybiBhbiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBmbGFncyBmb3VuZCBpbiB0aGUgcGFzc2VkIGFyZ3VtZW50cy5cbiAqXG4gKiBCeSBkZWZhdWx0LCBhbnkgYXJndW1lbnRzIHN0YXJ0aW5nIHdpdGggYC1gIG9yIGAtLWAgYXJlIGNvbnNpZGVyZWQgYm9vbGVhblxuICogZmxhZ3MuIElmIHRoZSBhcmd1bWVudCBuYW1lIGlzIGZvbGxvd2VkIGJ5IGFuIGVxdWFsIHNpZ24gKGA9YCkgaXQgaXNcbiAqIGNvbnNpZGVyZWQgYSBrZXktdmFsdWUgcGFpci4gQW55IGFyZ3VtZW50cyB3aGljaCBjb3VsZCBub3QgYmUgcGFyc2VkIGFyZVxuICogYXZhaWxhYmxlIGluIHRoZSBgX2AgcHJvcGVydHkgb2YgdGhlIHJldHVybmVkIG9iamVjdC5cbiAqXG4gKiBCeSBkZWZhdWx0LCB0aGlzIG1vZHVsZSB0cmllcyB0byBkZXRlcm1pbmUgdGhlIHR5cGUgb2YgYWxsIGFyZ3VtZW50c1xuICogYXV0b21hdGljYWxseSBhbmQgdGhlIHJldHVybiB0eXBlIG9mIHRoaXMgZnVuY3Rpb24gd2lsbCBoYXZlIGFuIGluZGV4XG4gKiBzaWduYXR1cmUgd2l0aCBgYW55YCBhcyB2YWx1ZSAoYHsgW3g6IHN0cmluZ106IGFueSB9YCkuXG4gKlxuICogSWYgdGhlIGBzdHJpbmdgLCBgYm9vbGVhbmAgb3IgYGNvbGxlY3RgIG9wdGlvbiBpcyBzZXQsIHRoZSByZXR1cm4gdmFsdWUgb2ZcbiAqIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBmdWxseSB0eXBlZCBhbmQgdGhlIGluZGV4IHNpZ25hdHVyZSBvZiB0aGUgcmV0dXJuXG4gKiB0eXBlIHdpbGwgY2hhbmdlIHRvIGB7IFt4OiBzdHJpbmddOiB1bmtub3duIH1gLlxuICpcbiAqIEFueSBhcmd1bWVudHMgYWZ0ZXIgYCctLSdgIHdpbGwgbm90IGJlIHBhcnNlZCBhbmQgd2lsbCBlbmQgdXAgaW4gYHBhcnNlZEFyZ3MuX2AuXG4gKlxuICogTnVtZXJpYy1sb29raW5nIGFyZ3VtZW50cyB3aWxsIGJlIHJldHVybmVkIGFzIG51bWJlcnMgdW5sZXNzIGBvcHRpb25zLnN0cmluZ2BcbiAqIG9yIGBvcHRpb25zLmJvb2xlYW5gIGlzIHNldCBmb3IgdGhhdCBhcmd1bWVudCBuYW1lLlxuICpcbiAqIEBwYXJhbSBhcmdzIEFuIGFycmF5IG9mIGNvbW1hbmQgbGluZSBhcmd1bWVudHMuXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIGZvciB0aGUgcGFyc2UgZnVuY3Rpb24uXG4gKlxuICogQHR5cGVQYXJhbSBUQXJncyBUeXBlIG9mIHJlc3VsdC5cbiAqIEB0eXBlUGFyYW0gVERvdWJsZURhc2ggVXNlZCBieSBgVEFyZ3NgIGZvciB0aGUgcmVzdWx0LlxuICogQHR5cGVQYXJhbSBUQm9vbGVhbnMgVXNlZCBieSBgVEFyZ3NgIGZvciB0aGUgcmVzdWx0LlxuICogQHR5cGVQYXJhbSBUU3RyaW5ncyBVc2VkIGJ5IGBUQXJnc2AgZm9yIHRoZSByZXN1bHQuXG4gKiBAdHlwZVBhcmFtIFRDb2xsZWN0YWJsZSBVc2VkIGJ5IGBUQXJnc2AgZm9yIHRoZSByZXN1bHQuXG4gKiBAdHlwZVBhcmFtIFROZWdhdGFibGUgVXNlZCBieSBgVEFyZ3NgIGZvciB0aGUgcmVzdWx0LlxuICogQHR5cGVQYXJhbSBURGVmYXVsdHMgVXNlZCBieSBgVEFyZ3NgIGZvciB0aGUgcmVzdWx0LlxuICogQHR5cGVQYXJhbSBUQWxpYXNlcyBVc2VkIGJ5IGBUQXJnc2AgZm9yIHRoZSByZXN1bHQuXG4gKiBAdHlwZVBhcmFtIFRBbGlhc0FyZ05hbWVzIFVzZWQgYnkgYFRBcmdzYCBmb3IgdGhlIHJlc3VsdC5cbiAqIEB0eXBlUGFyYW0gVEFsaWFzTmFtZXMgVXNlZCBieSBgVEFyZ3NgIGZvciB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4gVGhlIHBhcnNlZCBhcmd1bWVudHMuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBwYXJzZUFyZ3MgfSBmcm9tIFwiQHN0ZC9jbGkvcGFyc2UtYXJnc1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogLy8gRm9yIHByb3BlciB1c2UsIG9uZSBzaG91bGQgdXNlIGBwYXJzZUFyZ3MoRGVuby5hcmdzKWBcbiAqIGFzc2VydEVxdWFscyhwYXJzZUFyZ3MoW1wiLS1mb29cIiwgXCItLWJhcj1iYXpcIiwgXCIuL3F1dXgudHh0XCJdKSwge1xuICogICBmb286IHRydWUsXG4gKiAgIGJhcjogXCJiYXpcIixcbiAqICAgXzogW1wiLi9xdXV4LnR4dFwiXSxcbiAqIH0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFyZ3M8XG4gIFRBcmdzIGV4dGVuZHMgVmFsdWVzPFxuICAgIFRCb29sZWFucyxcbiAgICBUU3RyaW5ncyxcbiAgICBUQ29sbGVjdGFibGUsXG4gICAgVE5lZ2F0YWJsZSxcbiAgICBURGVmYXVsdHMsXG4gICAgVEFsaWFzZXNcbiAgPixcbiAgVERvdWJsZURhc2ggZXh0ZW5kcyBib29sZWFuIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxuICBUQm9vbGVhbnMgZXh0ZW5kcyBCb29sZWFuVHlwZSA9IHVuZGVmaW5lZCxcbiAgVFN0cmluZ3MgZXh0ZW5kcyBTdHJpbmdUeXBlID0gdW5kZWZpbmVkLFxuICBUQ29sbGVjdGFibGUgZXh0ZW5kcyBDb2xsZWN0YWJsZSA9IHVuZGVmaW5lZCxcbiAgVE5lZ2F0YWJsZSBleHRlbmRzIE5lZ2F0YWJsZSA9IHVuZGVmaW5lZCxcbiAgVERlZmF1bHRzIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXG4gIFRBbGlhc2VzIGV4dGVuZHMgQWxpYXNlczxUQWxpYXNBcmdOYW1lcywgVEFsaWFzTmFtZXM+IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxuICBUQWxpYXNBcmdOYW1lcyBleHRlbmRzIHN0cmluZyA9IHN0cmluZyxcbiAgVEFsaWFzTmFtZXMgZXh0ZW5kcyBzdHJpbmcgPSBzdHJpbmcsXG4+KFxuICBhcmdzOiBzdHJpbmdbXSxcbiAgb3B0aW9ucz86IFBhcnNlT3B0aW9uczxcbiAgICBUQm9vbGVhbnMsXG4gICAgVFN0cmluZ3MsXG4gICAgVENvbGxlY3RhYmxlLFxuICAgIFROZWdhdGFibGUsXG4gICAgVERlZmF1bHRzLFxuICAgIFRBbGlhc2VzLFxuICAgIFREb3VibGVEYXNoXG4gID4sXG4pOiBBcmdzPFRBcmdzLCBURG91YmxlRGFzaD4ge1xuICBjb25zdCB7XG4gICAgXCItLVwiOiBkb3VibGVEYXNoID0gZmFsc2UsXG4gICAgYWxpYXMgPSB7fSBhcyBOb25OdWxsYWJsZTxUQWxpYXNlcz4sXG4gICAgYm9vbGVhbiA9IGZhbHNlLFxuICAgIGRlZmF1bHQ6IGRlZmF1bHRzID0ge30gYXMgVERlZmF1bHRzICYgRGVmYXVsdHM8VEJvb2xlYW5zLCBUU3RyaW5ncz4sXG4gICAgc3RvcEVhcmx5ID0gZmFsc2UsXG4gICAgc3RyaW5nID0gW10sXG4gICAgY29sbGVjdCA9IFtdLFxuICAgIG5lZ2F0YWJsZSA9IFtdLFxuICAgIHVua25vd246IHVua25vd25GbiA9IChpOiBzdHJpbmcpOiB1bmtub3duID0+IGksXG4gIH0gPSBvcHRpb25zID8/IHt9O1xuICBjb25zdCBhbGlhc01hcDogTWFwPHN0cmluZywgU2V0PHN0cmluZz4+ID0gbmV3IE1hcCgpO1xuICBjb25zdCBib29sZWFuU2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHN0cmluZ1NldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBjb2xsZWN0U2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IG5lZ2F0YWJsZVNldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGxldCBhbGxCb29scyA9IGZhbHNlO1xuXG4gIGlmIChhbGlhcykge1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGFsaWFzKSkge1xuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkFsaWFzIHZhbHVlIG11c3QgYmUgZGVmaW5lZFwiKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGFsaWFzZXMgPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlIDogW3ZhbHVlXTtcbiAgICAgIGFsaWFzTWFwLnNldChrZXksIG5ldyBTZXQoYWxpYXNlcykpO1xuICAgICAgYWxpYXNlcy5mb3JFYWNoKChhbGlhcykgPT5cbiAgICAgICAgYWxpYXNNYXAuc2V0KFxuICAgICAgICAgIGFsaWFzLFxuICAgICAgICAgIG5ldyBTZXQoW2tleSwgLi4uYWxpYXNlcy5maWx0ZXIoKGl0KSA9PiBpdCAhPT0gYWxpYXMpXSksXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGJvb2xlYW4pIHtcbiAgICBpZiAodHlwZW9mIGJvb2xlYW4gPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICBhbGxCb29scyA9IGJvb2xlYW47XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGJvb2xlYW5BcmdzID0gQXJyYXkuaXNBcnJheShib29sZWFuKSA/IGJvb2xlYW4gOiBbYm9vbGVhbl07XG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBib29sZWFuQXJncy5maWx0ZXIoQm9vbGVhbikpIHtcbiAgICAgICAgYm9vbGVhblNldC5hZGQoa2V5KTtcbiAgICAgICAgYWxpYXNNYXAuZ2V0KGtleSk/LmZvckVhY2goKGFsKSA9PiB7XG4gICAgICAgICAgYm9vbGVhblNldC5hZGQoYWwpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoc3RyaW5nKSB7XG4gICAgY29uc3Qgc3RyaW5nQXJncyA9IEFycmF5LmlzQXJyYXkoc3RyaW5nKSA/IHN0cmluZyA6IFtzdHJpbmddO1xuICAgIGZvciAoY29uc3Qga2V5IG9mIHN0cmluZ0FyZ3MuZmlsdGVyKEJvb2xlYW4pKSB7XG4gICAgICBzdHJpbmdTZXQuYWRkKGtleSk7XG4gICAgICBhbGlhc01hcC5nZXQoa2V5KT8uZm9yRWFjaCgoYWwpID0+IHN0cmluZ1NldC5hZGQoYWwpKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY29sbGVjdCkge1xuICAgIGNvbnN0IGNvbGxlY3RBcmdzID0gQXJyYXkuaXNBcnJheShjb2xsZWN0KSA/IGNvbGxlY3QgOiBbY29sbGVjdF07XG4gICAgZm9yIChjb25zdCBrZXkgb2YgY29sbGVjdEFyZ3MuZmlsdGVyKEJvb2xlYW4pKSB7XG4gICAgICBjb2xsZWN0U2V0LmFkZChrZXkpO1xuICAgICAgYWxpYXNNYXAuZ2V0KGtleSk/LmZvckVhY2goKGFsKSA9PiBjb2xsZWN0U2V0LmFkZChhbCkpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChuZWdhdGFibGUpIHtcbiAgICBjb25zdCBuZWdhdGFibGVBcmdzID0gQXJyYXkuaXNBcnJheShuZWdhdGFibGUpID8gbmVnYXRhYmxlIDogW25lZ2F0YWJsZV07XG4gICAgZm9yIChjb25zdCBrZXkgb2YgbmVnYXRhYmxlQXJncy5maWx0ZXIoQm9vbGVhbikpIHtcbiAgICAgIG5lZ2F0YWJsZVNldC5hZGQoa2V5KTtcbiAgICAgIGFsaWFzTWFwLmdldChrZXkpPy5mb3JFYWNoKChhbGlhcykgPT4gbmVnYXRhYmxlU2V0LmFkZChhbGlhcykpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGFyZ3Y6IEFyZ3MgPSB7IF86IFtdIH07XG5cbiAgZnVuY3Rpb24gc2V0QXJndW1lbnQoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4sXG4gICAgYXJnOiBzdHJpbmcsXG4gICAgY29sbGVjdDogYm9vbGVhbixcbiAgKSB7XG4gICAgaWYgKFxuICAgICAgIWJvb2xlYW5TZXQuaGFzKGtleSkgJiZcbiAgICAgICFzdHJpbmdTZXQuaGFzKGtleSkgJiZcbiAgICAgICFhbGlhc01hcC5oYXMoa2V5KSAmJlxuICAgICAgIShhbGxCb29scyAmJiBGTEFHX05BTUVfUkVHRVhQLnRlc3QoYXJnKSkgJiZcbiAgICAgIHVua25vd25Gbj8uKGFyZywga2V5LCB2YWx1ZSkgPT09IGZhbHNlXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiAhc3RyaW5nU2V0LmhhcyhrZXkpKSB7XG4gICAgICB2YWx1ZSA9IGlzTnVtYmVyKHZhbHVlKSA/IE51bWJlcih2YWx1ZSkgOiB2YWx1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBjb2xsZWN0YWJsZSA9IGNvbGxlY3QgJiYgY29sbGVjdFNldC5oYXMoa2V5KTtcbiAgICBzZXROZXN0ZWQoYXJndiwga2V5LnNwbGl0KFwiLlwiKSwgdmFsdWUsIGNvbGxlY3RhYmxlKTtcbiAgICBhbGlhc01hcC5nZXQoa2V5KT8uZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBzZXROZXN0ZWQoYXJndiwga2V5LnNwbGl0KFwiLlwiKSwgdmFsdWUsIGNvbGxlY3RhYmxlKTtcbiAgICB9KTtcbiAgfVxuXG4gIGxldCBub3RGbGFnczogc3RyaW5nW10gPSBbXTtcblxuICAvLyBhbGwgYXJncyBhZnRlciBcIi0tXCIgYXJlIG5vdCBwYXJzZWRcbiAgY29uc3QgaW5kZXggPSBhcmdzLmluZGV4T2YoXCItLVwiKTtcbiAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgIG5vdEZsYWdzID0gYXJncy5zbGljZShpbmRleCArIDEpO1xuICAgIGFyZ3MgPSBhcmdzLnNsaWNlKDAsIGluZGV4KTtcbiAgfVxuXG4gIGFyZ3NMb29wOlxuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhcmcgPSBhcmdzW2ldITtcblxuICAgIGNvbnN0IGdyb3VwcyA9IGFyZy5tYXRjaChGTEFHX1JFR0VYUCk/Lmdyb3VwcztcblxuICAgIGlmIChncm91cHMpIHtcbiAgICAgIGNvbnN0IHsgZG91YmxlRGFzaCwgbmVnYXRlZCB9ID0gZ3JvdXBzO1xuICAgICAgbGV0IGtleSA9IGdyb3Vwcy5rZXkhO1xuICAgICAgbGV0IHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgdW5kZWZpbmVkID0gZ3JvdXBzLnZhbHVlO1xuXG4gICAgICBpZiAoZG91YmxlRGFzaCkge1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICBpZiAoYm9vbGVhblNldC5oYXMoa2V5KSkgdmFsdWUgPSBwYXJzZUJvb2xlYW5TdHJpbmcodmFsdWUpO1xuICAgICAgICAgIHNldEFyZ3VtZW50KGtleSwgdmFsdWUsIGFyZywgdHJ1ZSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmVnYXRlZCkge1xuICAgICAgICAgIGlmIChuZWdhdGFibGVTZXQuaGFzKGtleSkpIHtcbiAgICAgICAgICAgIHNldEFyZ3VtZW50KGtleSwgZmFsc2UsIGFyZywgZmFsc2UpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGtleSA9IGBuby0ke2tleX1gO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmV4dCA9IGFyZ3NbaSArIDFdO1xuXG4gICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgIWJvb2xlYW5TZXQuaGFzKGtleSkgJiZcbiAgICAgICAgICAgICFhbGxCb29scyAmJlxuICAgICAgICAgICAgIW5leHQuc3RhcnRzV2l0aChcIi1cIikgJiZcbiAgICAgICAgICAgICghYWxpYXNNYXAuaGFzKGtleSkgfHwgIWFsaWFzSXNCb29sZWFuKGFsaWFzTWFwLCBib29sZWFuU2V0LCBrZXkpKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdmFsdWUgPSBuZXh0O1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgc2V0QXJndW1lbnQoa2V5LCB2YWx1ZSwgYXJnLCB0cnVlKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpc0Jvb2xlYW5TdHJpbmcobmV4dCkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gcGFyc2VCb29sZWFuU3RyaW5nKG5leHQpO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgc2V0QXJndW1lbnQoa2V5LCB2YWx1ZSwgYXJnLCB0cnVlKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhbHVlID0gc3RyaW5nU2V0LmhhcyhrZXkpID8gXCJcIiA6IHRydWU7XG4gICAgICAgIHNldEFyZ3VtZW50KGtleSwgdmFsdWUsIGFyZywgdHJ1ZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgbGV0dGVycyA9IGFyZy5zbGljZSgxLCAtMSkuc3BsaXQoXCJcIik7XG5cbiAgICAgIGZvciAoY29uc3QgW2osIGxldHRlcl0gb2YgbGV0dGVycy5lbnRyaWVzKCkpIHtcbiAgICAgICAgY29uc3QgbmV4dCA9IGFyZy5zbGljZShqICsgMik7XG5cbiAgICAgICAgaWYgKG5leHQgPT09IFwiLVwiKSB7XG4gICAgICAgICAgc2V0QXJndW1lbnQobGV0dGVyLCBuZXh0LCBhcmcsIHRydWUpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKExFVFRFUl9SRUdFWFAudGVzdChsZXR0ZXIpKSB7XG4gICAgICAgICAgY29uc3QgZ3JvdXBzID0gVkFMVUVfUkVHRVhQLmV4ZWMobmV4dCk/Lmdyb3VwcztcbiAgICAgICAgICBpZiAoZ3JvdXBzKSB7XG4gICAgICAgICAgICBzZXRBcmd1bWVudChsZXR0ZXIsIGdyb3Vwcy52YWx1ZSEsIGFyZywgdHJ1ZSk7XG4gICAgICAgICAgICBjb250aW51ZSBhcmdzTG9vcDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKE5VTUJFUl9SRUdFWFAudGVzdChuZXh0KSkge1xuICAgICAgICAgICAgc2V0QXJndW1lbnQobGV0dGVyLCBuZXh0LCBhcmcsIHRydWUpO1xuICAgICAgICAgICAgY29udGludWUgYXJnc0xvb3A7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxldHRlcnNbaiArIDFdPy5tYXRjaChTUEVDSUFMX0NIQVJfUkVHRVhQKSkge1xuICAgICAgICAgIHNldEFyZ3VtZW50KGxldHRlciwgYXJnLnNsaWNlKGogKyAyKSwgYXJnLCB0cnVlKTtcbiAgICAgICAgICBjb250aW51ZSBhcmdzTG9vcDtcbiAgICAgICAgfVxuICAgICAgICBzZXRBcmd1bWVudChsZXR0ZXIsIHN0cmluZ1NldC5oYXMobGV0dGVyKSA/IFwiXCIgOiB0cnVlLCBhcmcsIHRydWUpO1xuICAgICAgfVxuXG4gICAgICBrZXkgPSBhcmcuc2xpY2UoLTEpO1xuICAgICAgaWYgKGtleSA9PT0gXCItXCIpIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBuZXh0QXJnID0gYXJnc1tpICsgMV07XG5cbiAgICAgIGlmIChuZXh0QXJnKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAhSFlQSEVOX1JFR0VYUC50ZXN0KG5leHRBcmcpICYmXG4gICAgICAgICAgIWJvb2xlYW5TZXQuaGFzKGtleSkgJiZcbiAgICAgICAgICAoIWFsaWFzTWFwLmhhcyhrZXkpIHx8ICFhbGlhc0lzQm9vbGVhbihhbGlhc01hcCwgYm9vbGVhblNldCwga2V5KSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgc2V0QXJndW1lbnQoa2V5LCBuZXh0QXJnLCBhcmcsIHRydWUpO1xuICAgICAgICAgIGkrKztcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNCb29sZWFuU3RyaW5nKG5leHRBcmcpKSB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJzZUJvb2xlYW5TdHJpbmcobmV4dEFyZyk7XG4gICAgICAgICAgc2V0QXJndW1lbnQoa2V5LCB2YWx1ZSwgYXJnLCB0cnVlKTtcbiAgICAgICAgICBpKys7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNldEFyZ3VtZW50KGtleSwgc3RyaW5nU2V0LmhhcyhrZXkpID8gXCJcIiA6IHRydWUsIGFyZywgdHJ1ZSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAodW5rbm93bkZuPy4oYXJnKSAhPT0gZmFsc2UpIHtcbiAgICAgIGFyZ3YuXy5wdXNoKFxuICAgICAgICBzdHJpbmdTZXQuaGFzKFwiX1wiKSB8fCAhaXNOdW1iZXIoYXJnKSA/IGFyZyA6IE51bWJlcihhcmcpLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoc3RvcEVhcmx5KSB7XG4gICAgICBhcmd2Ll8ucHVzaCguLi5hcmdzLnNsaWNlKGkgKyAxKSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhkZWZhdWx0cykpIHtcbiAgICBjb25zdCBrZXlzID0ga2V5LnNwbGl0KFwiLlwiKTtcbiAgICBpZiAoIWhhc05lc3RlZChhcmd2LCBrZXlzKSkge1xuICAgICAgc2V0TmVzdGVkKGFyZ3YsIGtleXMsIHZhbHVlKTtcbiAgICAgIGFsaWFzTWFwLmdldChrZXkpPy5mb3JFYWNoKChrZXkpID0+XG4gICAgICAgIHNldE5lc3RlZChhcmd2LCBrZXkuc3BsaXQoXCIuXCIpLCB2YWx1ZSlcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgZm9yIChjb25zdCBrZXkgb2YgYm9vbGVhblNldC5rZXlzKCkpIHtcbiAgICBjb25zdCBrZXlzID0ga2V5LnNwbGl0KFwiLlwiKTtcbiAgICBpZiAoIWhhc05lc3RlZChhcmd2LCBrZXlzKSkge1xuICAgICAgY29uc3QgdmFsdWUgPSBjb2xsZWN0U2V0LmhhcyhrZXkpID8gW10gOiBmYWxzZTtcbiAgICAgIHNldE5lc3RlZChhcmd2LCBrZXlzLCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgZm9yIChjb25zdCBrZXkgb2Ygc3RyaW5nU2V0LmtleXMoKSkge1xuICAgIGNvbnN0IGtleXMgPSBrZXkuc3BsaXQoXCIuXCIpO1xuICAgIGlmICghaGFzTmVzdGVkKGFyZ3YsIGtleXMpICYmIGNvbGxlY3RTZXQuaGFzKGtleSkpIHtcbiAgICAgIHNldE5lc3RlZChhcmd2LCBrZXlzLCBbXSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGRvdWJsZURhc2gpIHtcbiAgICBhcmd2W1wiLS1cIl0gPSBub3RGbGFncztcbiAgfSBlbHNlIHtcbiAgICBhcmd2Ll8ucHVzaCguLi5ub3RGbGFncyk7XG4gIH1cblxuICByZXR1cm4gYXJndiBhcyBBcmdzPFRBcmdzLCBURG91YmxlRGFzaD47XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7O0NBWUMsR0FFRDs7Q0FFQyxHQTZWRCxNQUFNLGNBQ0o7QUFDRixNQUFNLGdCQUFnQjtBQUN0QixNQUFNLGdCQUFnQjtBQUN0QixNQUFNLGdCQUFnQjtBQUN0QixNQUFNLGVBQWU7QUFDckIsTUFBTSxtQkFBbUI7QUFDekIsTUFBTSxzQkFBc0I7QUFFNUIsTUFBTSx3QkFBd0I7QUFFOUIsU0FBUyxTQUFTLE1BQWM7RUFDOUIsT0FBTyxzQkFBc0IsSUFBSSxDQUFDLFdBQVcsT0FBTyxRQUFRLENBQUMsT0FBTztBQUN0RTtBQUVBLFNBQVMsVUFDUCxNQUFxQixFQUNyQixJQUFjLEVBQ2QsS0FBYyxFQUNkLFVBQVUsS0FBSztFQUVmLE9BQU87T0FBSTtHQUFLO0VBQ2hCLE1BQU0sTUFBTSxLQUFLLEdBQUc7RUFFcEIsS0FBSyxPQUFPLENBQUMsQ0FBQyxNQUFRLFNBQVUsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDO0VBRWpELElBQUksU0FBUztJQUNYLE1BQU0sSUFBSSxNQUFNLENBQUMsSUFBSTtJQUNyQixJQUFJLE1BQU0sT0FBTyxDQUFDLElBQUk7TUFDcEIsRUFBRSxJQUFJLENBQUM7TUFDUDtJQUNGO0lBRUEsUUFBUSxJQUFJO01BQUM7TUFBRztLQUFNLEdBQUc7TUFBQztLQUFNO0VBQ2xDO0VBRUEsTUFBTSxDQUFDLElBQUksR0FBRztBQUNoQjtBQUVBLFNBQVMsVUFBVSxNQUFxQixFQUFFLElBQWM7RUFDdEQsS0FBSyxNQUFNLE9BQU8sS0FBTTtJQUN0QixNQUFNLFFBQVEs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