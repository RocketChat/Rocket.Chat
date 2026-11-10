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
 * The task pane's script, with the workspace's wording of every text it shows declared ahead of its code.
 *
 * Strict from here rather than from the file: a directive only counts as the very first statement.
 */
export const buildOutlookAddInScript = (source: string, strings: Record<string, string>): string =>
	`'use strict';\nconst STRINGS = ${toScriptLiteral(strings)};\n${source}`;

/**
 * Answers with the script, or with a bare `304` when the browser already holds this exact version.
 *
 * The texts are settings, so every load has to ask; the tag is what keeps asking from costing a download.
 */
export const sendOutlookAddInScript = (req: IncomingMessage, res: ServerResponse, script: string): void => {
	const etag = `"${crypto.createHash('sha1').update(script).digest('base64url')}"`;

	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('ETag', etag);

	if (req.headers['if-none-match'] === etag) {
		res.writeHead(304);
		res.end();
		return;
	}

	res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
	res.writeHead(200);
	res.end(script);
};
