/* eslint-disable import/no-duplicates */
import type * as AST from '@oxc-project/types';
import { print } from 'esrap';
import ts from 'esrap/languages/ts';

export function printCode(program: AST.Program): string {
	return print(
		// @ts-expect-error esrap types
		program,
		ts(),
	).code;
}
