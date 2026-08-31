import type { Node, AnyNode } from 'acorn';
import { parse } from 'acorn';
import { fullAncestor } from 'acorn-walk';
import { generate } from 'astring';

import * as operations from './operations';
import type { WalkerState } from './operations';

function fixAst(ast: Node): boolean {
	const pendingOperations = [
		operations.fixLivechatIsOnlineCalls,
		operations.checkReassignmentOfModifiedIdentifiers,
		operations.fixRoomUsernamesCalls,
	];

	// Have we touched the tree?
	let isModified = false;

	while (pendingOperations.length) {
		const ops = pendingOperations.splice(0);
		const state: WalkerState = {
			isModified: false,
			functionIdentifiers: new Set<string>(),
		};

		fullAncestor(
			ast,
			(node, state, ancestors, type) => {
				ops.forEach((operation) => operation(node as AnyNode, state as WalkerState, ancestors as AnyNode[], type));
			},
			undefined,
			state,
		);

		if (state.isModified) {
			isModified = true;
		}

		if (state.functionIdentifiers.size) {
			pendingOperations.push(
				operations.buildFixModifiedFunctionsOperation(state.functionIdentifiers),
				operations.checkReassignmentOfModifiedIdentifiers,
			);
		}
	}

	return isModified;
}

export function fixBrokenSynchronousAPICalls(appSource: string): string {
	const astRootNode = parse(appSource, {
		// Latest ecma version supported by this version of acorn.
		ecmaVersion: 'latest',
		// Allow everything, we don't want to complain if code is badly written
		// Also, since the code itself has been transpiled, the chance of getting
		// shenanigans is lower
		allowReserved: true,
		allowReturnOutsideFunction: true,
		allowImportExportEverywhere: true,
		allowAwaitOutsideFunction: true,
		allowSuperOutsideMethod: true,
	});

	if (fixAst(astRootNode)) {
		return generate(astRootNode);
	}

	return appSource;
}
