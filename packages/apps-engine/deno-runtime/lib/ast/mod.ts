import { generate } from "astring";
// @deno-types="../../acorn.d.ts"
import { Program, parse } from "acorn";
// @deno-types="../../acorn-walk.d.ts"
import { fullAncestor } from "acorn-walk";

import * as operations from "./operations.ts";
import type { WalkerState } from "./operations.ts";

function fixAst(ast: Program): boolean {
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

        fullAncestor(ast, (node, state, ancestors, type) => {
            ops.forEach(operation => operation(node, state, ancestors, type));
        }, undefined, state);

        if (state.isModified) {
            isModified = true;
        }

        if (state.functionIdentifiers.size) {
            pendingOperations.push(
                operations.buildFixModifiedFunctionsOperation(state.functionIdentifiers),
                operations.checkReassignmentOfModifiedIdentifiers
            );
        }
    }

    return isModified;
}

export function fixBrokenSynchronousAPICalls(appSource: string): string {
    const astRootNode = parse(appSource, {
        ecmaVersion: 2017,
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
