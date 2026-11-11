import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * JSON that stays inert wherever a script lands: `<` cannot start a closing tag, and the two line separators
 * that JSON allows in strings but older JavaScript engines do not are escaped too.
 */
const toScriptLiteral = (value: unknown): string =>
	JSON.stringify(value)
		.replace(/</g, '\\u003c')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');

/**
 * The add-in's library, handed the workspace's wording of every text it shows.
 *
 * Wrapped in a function so that nothing it declares reaches the page but what it publishes on purpose: the
 * behavior script is the workspace's to write, and must be free to use any name. Strict from inside the function,
 * where the directive is the first statement.
 */
export const buildOutlookAddInScript = (source: string, strings: Record<string, string>): string =>
	`(function (STRINGS) {\n'use strict';\n${source}\n})(${toScriptLiteral(strings)});\n`;

/**
 * Answers with one of the add-in's files, or with a bare `304` when the browser already holds this exact version.
 *
 * They are all settings, so every load has to ask; the tag is what keeps asking from costing a download.
 */
export const sendOutlookAddInFile = (req: IncomingMessage, res: ServerResponse, content: string, contentType: string): void => {
	const etag = `"${crypto.createHash('sha1').update(content).digest('base64url')}"`;

	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('ETag', etag);

	if (req.headers['if-none-match'] === etag) {
		res.writeHead(304);
		res.end();
		return;
	}

	res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
	res.writeHead(200);
	res.end(content);
};
