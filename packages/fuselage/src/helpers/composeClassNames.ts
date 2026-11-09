import { exhaustiveCheck } from './exhaustiveCheck';
import type { Falsy } from '../types/Falsy';

const withPrefix = (prefix?: string) => (modifier: string) => (prefix ? `${prefix}--${modifier}` : modifier);

export const composeClassNames =
	(prefix?: string) =>
	(...args: unknown[]) => {
		const addPrefix = withPrefix(prefix);

		const classNames = args
			.map((arg) => {
				if (typeof arg === 'string') {
					return arg;
				}

				if (typeof arg === 'object' && Array.isArray(arg)) {
					return arg.filter(Boolean).map(addPrefix).join(' ');
				}

				if (typeof arg === 'object' && arg !== null) {
					return Object.entries(arg)
						.map(([key, value]) => {
							if (typeof value === 'boolean') {
								if (value) {
									return addPrefix(key);
								}

								return null;
							}

							if (typeof value === 'string' || typeof value === 'number') {
								return addPrefix(`${key}-${value}`);
							}

							return null;
						})
						.filter(Boolean)
						.join(' ');
				}

				return null;
			})
			.concat()
			.filter(Boolean)
			.join(' ');

		return [prefix, classNames].filter(Boolean).join(' ');
	};

type CxArg = Falsy | string | { [className: string]: boolean | string | number };

/**
 * Composes class names into a single string based on flags.
 *
 * Any falsy value passed as an argument will be ignored.
 *
 * If a string is passed, it will be used as a class name.
 *
 * If a dictionary object is passed, its keys will be used as class names and its values will be used as modifiers --
 * unless the value is a boolean, in which case the key will be used as a class name if the value is `true`.
 *
 * @example
 * ```ts
 * cx('a', false, 'b', null, { c: true, d: false, e: 'f', f: 1 }); // 'a b c e-f f-1'
 * ```
 *
 * @param args a sequence of falsy values, strings and dictionary objects containing the class names
 * @returns a space-separated string of class names
 */
export const cx = (...args: CxArg[]): string =>
	args
		.flatMap((arg) => {
			if (!arg) {
				return [];
			}

			if (typeof arg === 'string') {
				return arg;
			}

			if (typeof arg === 'object') {
				return Object.entries(arg).flatMap(([className, value]) => {
					if (typeof value === 'boolean') {
						return value ? className : [];
					}

					return `${className}-${value}`;
				});
			}

			return exhaustiveCheck(arg);
		})
		.join(' ');

/**
 * Composes class name modifiers under a class name into a single class names' string based on flags.
 *
 * This function returns a function similar to `cx`, with the difference it handles the arguments as class name
 * modifiers (based on BEM CSS conventions). However, it's recommended to use `cxx` as a curried function.
 *
 * @example
 * ```ts
 * cxx('z')('a', false, 'b', null, { c: true, d: false, e: 'f', f: 1 }); // 'z z--a z--b z--c z--e-f z--f-1'
 * ```
 * @param className the class name
 * @param args a sequence of falsy values, strings and dictionary objects containing the modifiers
 * @returns a space-separated string of class names
 */
export const cxx =
	(className: string) =>
	(...args: CxArg[]): string => {
		const classNames = args.flatMap((arg) => {
			if (!arg) {
				return [];
			}

			if (typeof arg === 'string') {
				return `${className}--${arg}`;
			}

			if (typeof arg === 'object') {
				return Object.entries(arg).flatMap(([modifier, value]) => {
					if (typeof value === 'boolean') {
						return value ? `${className}--${modifier}` : [];
					}

					return `${className}--${modifier}-${value}`;
				});
			}

			return exhaustiveCheck(arg);
		});

		classNames.unshift(className);

		return classNames.join(' ');
	};
