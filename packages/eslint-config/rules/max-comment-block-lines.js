/**
 * Flags comment blocks longer than the budget in `docs/code-comments.md`.
 *
 * Length is the only part of that standard a linter can judge; whether a comment
 * earns its place stays a review call. Directive comments (`eslint-*`, `@ts-*`,
 * `prettier-ignore`, `istanbul ignore`, …) are exempt, as are file-leading headers.
 */

const DIRECTIVE = /^\s*(eslint|@ts-|prettier-ignore|istanbul ignore|c8 ignore|v8 ignore|webpack|globals?\s|jshint|jslint|type-coverage)/;

const LICENSE = /\b(copyright|licen[cs]e|SPDX-License-Identifier|all rights reserved)\b/i;

const isDirective = (comment) => DIRECTIVE.test(comment.value);

/** A license banner, not documentation — exempt wherever it sits, which in practice is the top of the file. */
const isLicenseHeader = (comment) => LICENSE.test(comment.value);

/**
 * Whether the comment starts its own line. Trailing comments on consecutive code
 * lines are not a block, however many of them line up.
 */
const startsItsOwnLine = (comment, sourceCode) =>
	sourceCode.lines[comment.loc.start.line - 1].slice(0, comment.loc.start.column).trim() === '';

/** @type {import('eslint').Rule.RuleModule} */
export default {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Enforce the comment length budget from docs/code-comments.md',
			url: 'https://github.com/RocketChat/Rocket.Chat/blob/develop/docs/code-comments.md',
		},
		schema: [
			{
				type: 'object',
				properties: {
					maxBlockLines: { type: 'integer', minimum: 1 },
					maxConsecutiveLineComments: { type: 'integer', minimum: 1 },
				},
				additionalProperties: false,
			},
		],
		messages: {
			blockTooLong:
				'Comment block is {{actual}} lines, over the {{max}}-line budget. Keep the constraint, drop the narration, and move any reasoning about how the change was reached to the PR description. See docs/code-comments.md.',
			tooManyLineComments:
				'{{actual}} consecutive `//` lines, over the limit of {{max}}. This much explanation usually means the code below wants a named function. See docs/code-comments.md.',
		},
	},

	create(context) {
		const { maxBlockLines = 6, maxConsecutiveLineComments = 3 } = context.options[0] ?? {};
		const sourceCode = context.sourceCode ?? context.getSourceCode();

		return {
			Program() {
				const comments = sourceCode.getAllComments().filter((comment) => !isDirective(comment));

				let run = [];

				const flushRun = () => {
					if (run.length > maxConsecutiveLineComments) {
						context.report({
							loc: { start: run[0].loc.start, end: run[run.length - 1].loc.end },
							messageId: 'tooManyLineComments',
							data: { actual: String(run.length), max: String(maxConsecutiveLineComments) },
						});
					}
					run = [];
				};

				for (const comment of comments) {
					if (comment.type === 'Line') {
						if (!startsItsOwnLine(comment, sourceCode)) {
							flushRun();
							continue;
						}

						const previous = run[run.length - 1];
						if (previous && comment.loc.start.line === previous.loc.start.line + 1) {
							run.push(comment);
						} else {
							flushRun();
							run = [comment];
						}
						continue;
					}

					flushRun();

					if (isLicenseHeader(comment)) {
						continue;
					}

					const lines = comment.loc.end.line - comment.loc.start.line + 1;
					if (lines > maxBlockLines) {
						context.report({
							node: comment,
							messageId: 'blockTooLong',
							data: { actual: String(lines), max: String(maxBlockLines) },
						});
					}
				}

				flushRun();
			},
		};
	},
};
