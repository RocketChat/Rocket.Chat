/**
 * Utility function to check exhaustiveness of a switch statement or if-else statements.
 *
 * In TypeScript, variables going through a sequence of conditionals, like cases in switch statements or if-else
 * statements, the variable type is incrementally narrowed as the conditionals are evaluated until it reaches the
 * `never` type, meaning all possible cases have been covered. This function is used to check, at compilation time, that
 * all possible cases have been covered (i.e. if the conditional checks were exhaustive) and should only be called in
 * unreachable blocks of code.
 *
 * @example
 * ```ts
 * declare const value: 'foo' | 'bar';
 * switch (value) {
 *   case 'foo':
 *     // ...
 *     break;
 *   case 'bar':
 *     // ...
 *     break;
 *   default: // should be unreachable
 *     exhaustiveCheck(value); // `value` type should be `never`, otherwise the compilation fails
 * }
 * ```
 *
 * @param _ the value which type should be `never`
 * @throws {Error} will always throw an error if it's reached
 */
export const exhaustiveCheck = (_: never): never => {
	throw new Error('Exhaustive check failed');
};
