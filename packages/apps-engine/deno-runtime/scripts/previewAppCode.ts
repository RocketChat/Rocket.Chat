/**
 * CLI that takes a file path as an argument, process the file content via the AST
 * and prints the resulting generated code to the console.
 *
 * Use this to check how the runtime might be meddling with your app code.
 */

import { wrapAppCode, buildRequire } from '../handlers/app/construct.ts';
import { fixBrokenSynchronousAPICalls } from "../lib/ast/mod.ts";

const [inputPath] = Deno.args;

async function main(inputPath: string) {
	let content: string;

	try {
		content = await Deno.readTextFile(inputPath);
	} catch (error) {
		console.error(error);
		Deno.exit(1);
	}

	const processedContent = fixBrokenSynchronousAPICalls(content);

	console.log(processedContent);

	const func = wrapAppCode(processedContent);
	const require = buildRequire();
	// const require = () => ({});

	const exports = await func(require);

	console.log(exports.zAmcOmniBandwidthApp);
}

main(inputPath);
