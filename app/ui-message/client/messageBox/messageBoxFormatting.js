import { Markdown } from '../../../markdown/client';
import { settings } from '../../../settings';

export const formattingButtons = [
	{
		label: 'bold',
		icon: 'bold',
		pattern: '*{{text}}*',
		command: 'b',
		condition: () => Markdown && settings.get('Markdown_Parser') === 'original',
	},
	{
		label: 'bold',
		icon: 'bold',
		pattern: '**{{text}}**',
		command: 'b',
		condition: () => Markdown && settings.get('Markdown_Parser') === 'marked',
	},
	{
		label: 'italic',
		icon: 'italic',
		pattern: '_{{text}}_',
		command: 'i',
		condition: () => Markdown && settings.get('Markdown_Parser') !== 'disabled',
	},
	{
		label: 'strike',
		icon: 'strike',
		pattern: '~{{text}}~',
		condition: () => Markdown && settings.get('Markdown_Parser') === 'original',
	},
	{
		label: 'strike',
		icon: 'strike',
		pattern: '~~{{text}}~~',
		condition: () => Markdown && settings.get('Markdown_Parser') === 'marked',
	},
	{
		label: 'inline_code',
		icon: 'code',
		pattern: '`{{text}}`',
		condition: () => Markdown && settings.get('Markdown_Parser') !== 'disabled',
	},
	{
		label: 'multi_line',
		icon: 'multiline',
		pattern: '```\n{{text}}\n``` ',
		condition: () => Markdown && settings.get('Markdown_Parser') !== 'disabled',
	},
	{
		label: 'KaTeX',
		text: () => {
			if (!settings.get('Katex_Enabled')) {
				return;
			}
			if (settings.get('Katex_Dollar_Syntax')) {
				return '$$KaTeX$$';
			}
			if (settings.get('Katex_Parenthesis_Syntax')) {
				return '\\[KaTeX\\]';
			}
		},
		link: 'https://khan.github.io/KaTeX/function-support.html',
		condition: () => settings.get('Katex_Enabled'),
	},
];

export function applyFormatting(pattern, input) {
	const { selectionEnd = input.value.length, selectionStart = 0 } = input;
	const initText = input.value.slice(0, selectionStart);
	const selectedText = input.value.slice(selectionStart, selectionEnd);
	const finalText = input.value.slice(selectionEnd, input.value.length);

	input.focus();

	const startPattern = pattern.substr(0, pattern.indexOf('{{text}}'));
	const startPatternFound = [...startPattern].reverse().every((char, index) => input.value.substr(selectionStart - index - 1, 1) === char);

	if (startPatternFound) {
		const endPattern = pattern.substr(pattern.indexOf('{{text}}') + '{{text}}'.length);
		const endPatternFound = [...endPattern].every((char, index) => input.value.substr(selectionEnd + index, 1) === char);

		if (endPatternFound) {
			input.selectionStart = selectionStart - startPattern.length;
			input.selectionEnd = selectionEnd + endPattern.length;

			if (!document.execCommand || !document.execCommand('insertText', false, selectedText)) {
				input.value = initText.substr(0, initText.length - startPattern.length) + selectedText + finalText.substr(endPattern.length);
			}

			input.selectionStart = selectionStart - startPattern.length;
			input.selectionEnd = input.selectionStart + selectedText.length;
			$(input).change();
			return;
		}
	}

	if (!document.execCommand || !document.execCommand('insertText', false, pattern.replace('{{text}}', selectedText))) {
		input.value = initText + pattern.replace('{{text}}', selectedText) + finalText;
	}

	input.selectionStart = selectionStart + pattern.indexOf('{{text}}');
	input.selectionEnd = input.selectionStart + selectedText.length;
	$(input).change();
}
