import { getSelectionRange, setSelectionRange } from './selectionRange';

export const formatMarkdown = (text: string): string => {
	const symbolPlaceholder = { '*': '{{S1}}', '_': '{{S2}}', '~': '{{S3}}' }; // Prevent re-processing
	const symbolClass = 'md-symbol'; // Class for markdown symbols

	// Step 1: Apply Markdown transformations in order of precedence
	text = text
		// Step 1a: Bold + Italics + Strikethrough (*_~text~_*, _*~text~*_, etc.)
		.replace(
			/\*~_(\S(?:.*?\S)?)_~\*/g,
			`${symbolPlaceholder['*']}${symbolPlaceholder['~']}${symbolPlaceholder._}<strong><em><del>$1</del></em></strong>${symbolPlaceholder._}${symbolPlaceholder['~']}${symbolPlaceholder['*']}`,
		)
		.replace(
			/\*_~(\S(?:.*?\S)?)~_\*/g,
			`${symbolPlaceholder['*']}${symbolPlaceholder._}${symbolPlaceholder['~']}<strong><em><del>$1</del></em></strong>${symbolPlaceholder['~']}${symbolPlaceholder._}${symbolPlaceholder['*']}`,
		)
		.replace(
			/_\*~(\S(?:.*?\S)?)~\*_/g,
			`${symbolPlaceholder._}${symbolPlaceholder['*']}${symbolPlaceholder['~']}<strong><em><del>$1</del></em></strong>${symbolPlaceholder['~']}${symbolPlaceholder['*']}${symbolPlaceholder._}`,
		)
		.replace(
			/_~\*(\S(?:.*?\S)?)\*_~/g,
			`${symbolPlaceholder._}${symbolPlaceholder['~']}${symbolPlaceholder['*']}<strong><em><del>$1</del></em></strong>${symbolPlaceholder['*']}${symbolPlaceholder['~']}${symbolPlaceholder._}`,
		)
		.replace(
			/~\*_([\S](?:.*?\S)?)_\*~/g,
			`${symbolPlaceholder['~']}${symbolPlaceholder['*']}${symbolPlaceholder._}<strong><em><del>$1</del></em></strong>${symbolPlaceholder._}${symbolPlaceholder['*']}${symbolPlaceholder['~']}`,
		)
		.replace(
			/~_\*(\S(?:.*?\S)?)\*_~/g,
			`${symbolPlaceholder['~']}${symbolPlaceholder._}${symbolPlaceholder['*']}<strong><em><del>$1</del></em></strong>${symbolPlaceholder['*']}${symbolPlaceholder._}${symbolPlaceholder['~']}`,
		)

		// Step 1b: Bold + Italics (*_text_*, _*text*_)
		.replace(
			/\*_(\S(?:.*?\S)?)_\*/g,
			`${symbolPlaceholder['*']}${symbolPlaceholder._}<strong><em>$1</em></strong>${symbolPlaceholder._}${symbolPlaceholder['*']}`,
		)
		.replace(
			/_\*(\S(?:.*?\S)?)\*_/g,
			`${symbolPlaceholder._}${symbolPlaceholder['*']}<strong><em>$1</em></strong>${symbolPlaceholder['*']}${symbolPlaceholder._}`,
		)

		// Step 1c: Italics + Strikethrough (_~text~_, ~_text_~)
		.replace(
			/_~(\S(?:.*?\S)?)~_/g,
			`${symbolPlaceholder._}${symbolPlaceholder['~']}<em><del>$1</del></em>${symbolPlaceholder['~']}${symbolPlaceholder._}`,
		)
		.replace(
			/~_(\S(?:.*?\S)?)_~/g,
			`${symbolPlaceholder['~']}${symbolPlaceholder._}<em><del>$1</del></em>${symbolPlaceholder._}${symbolPlaceholder['~']}`,
		)

		// Step 1d: Bold + Strikethrough (*~text~*, ~*text*~)
		.replace(
			/\*~(\S(?:.*?\S)?)~\*/g,
			`${symbolPlaceholder['*']}${symbolPlaceholder['~']}<strong><del>$1</del></strong>${symbolPlaceholder['~']}${symbolPlaceholder['*']}`,
		)
		.replace(
			/~\*(\S(?:.*?\S)?)\*~/g,
			`${symbolPlaceholder['~']}${symbolPlaceholder['*']}<strong><del>$1</del></strong>${symbolPlaceholder['*']}${symbolPlaceholder['~']}`,
		)

		// Step 1e: Regular Bold (*text*)
		.replace(/\*(\S(?:.*?\S)?)\*/g, `${symbolPlaceholder['*']}<strong>$1</strong>${symbolPlaceholder['*']}`)

		// Step 1f: Regular Italics (_text_)
		.replace(/_(\S(?:.*?\S)?)_/g, `${symbolPlaceholder._}<em>$1</em>${symbolPlaceholder._}`)

		// Step 1g: Regular Strikethrough (~text~)
		.replace(/~(\S(?:.*?\S)?)~/g, `${symbolPlaceholder['~']}<del>$1</del>${symbolPlaceholder['~']}`)

		// Step 1h: Replace newlines with <br>
		.replace(/\n/g, '<br>');

	// Step 2: Replace placeholders back with visible span elements
	text = text
		.replace(/{{S1}}/g, `<span class="${symbolClass}">*</span>`)
		.replace(/{{S2}}/g, `<span class="${symbolClass}">_</span>`)
		.replace(/{{S3}}/g, `<span class="${symbolClass}">~</span>`);

	return text;
};

export const replaceSelectionWithHTML = (html: string): void => {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return;

	const range = selection.getRangeAt(0);
	range.deleteContents();

	// Convert HTML string to DOM nodes
	const template = document.createElement('template');
	template.innerHTML = html;
	const fragment = template.content;

	// Insert the new content
	range.insertNode(fragment);

	// Move the caret after the inserted content
	range.collapse(false);
	selection.removeAllRanges();
	selection.addRange(range);
};

export const convertToHTML = (input: HTMLDivElement): void => {
	console.log('convertToHTML');
	const text = input.innerText.replace(/\n{2,}/g, (match) => '\n'.repeat((match.length + 1) / 2));

	// Store the selectionRange
	const { selectionStart, selectionEnd } = getSelectionRange(input);

	const chunks = text.match(/[^\n]+|\n+/g) || []; // match either non-newline text OR one/more \n
	let result = '';

	for (const chunk of chunks) {
		if (chunk.startsWith('\n')) {
			const newlineCount = chunk.length;
			// One newline ends the previous block (already done), extra ones are <div><br></div>
			for (let i = 1; i < newlineCount; i++) {
				result += `<div><br></div>`;
			}
		} else {
			result += `<div>${chunk}</div>`;
		}
	}

	console.log(result);
	// console.log(formatMarkdown(result));

	// select the entire text
	setSelectionRange(input, 0, text.length);

	// replace with the updated markdown
	input.innerHTML = formatMarkdown(result);

	// restore the position
	setSelectionRange(input, selectionStart, selectionEnd);
};
