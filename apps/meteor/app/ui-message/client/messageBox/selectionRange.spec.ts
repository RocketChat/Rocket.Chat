import { getSelectionRange, setSelectionRange } from './selectionRange';

const makeInput = (html: string): HTMLDivElement => {
	const input = document.createElement('div');
	input.contentEditable = 'true';
	input.innerHTML = html;
	document.body.appendChild(input);
	return input;
};

const placeCaret = (node: Node, offset: number): void => {
	const range = document.createRange();
	range.setStart(node, offset);
	range.collapse(true);
	const sel = window.getSelection();
	sel?.removeAllRanges();
	sel?.addRange(range);
};

const clearSelection = (): void => {
	window.getSelection()?.removeAllRanges();
};

afterEach(() => {
	clearSelection();
	document.body.innerHTML = '';
});

describe('getSelectionRange', () => {
	it('returns a collapsed range at the caret inside a text node', () => {
		const input = makeInput('hello');
		placeCaret(input.firstChild as Node, 2);

		expect(getSelectionRange(input)).toEqual({ selectionStart: 2, selectionEnd: 2 });
	});

	it('counts a block boundary as a single newline (matches innerText a\\nb)', () => {
		const input = makeInput('<div>a</div><div>b</div>');
		const secondBlockText = input.childNodes[1].firstChild as Node;
		placeCaret(secondBlockText, 1);

		// a(0..1) \n(1..2) b(2..3) -> caret after "b" is flat offset 3
		expect(getSelectionRange(input)).toEqual({ selectionStart: 3, selectionEnd: 3 });
	});

	it('does not count the first block as a leading newline', () => {
		const input = makeInput('<div>ab</div>');
		placeCaret(input.firstChild?.firstChild as Node, 1);

		expect(getSelectionRange(input)).toEqual({ selectionStart: 1, selectionEnd: 1 });
	});

	it('ignores inline formatting tags when computing the offset', () => {
		const input = makeInput('a<strong>bc</strong>d');
		const lastText = input.childNodes[2] as Node;
		placeCaret(lastText, 1);

		// "abcd" -> caret after "d" is 4
		expect(getSelectionRange(input)).toEqual({ selectionStart: 4, selectionEnd: 4 });
	});

	it('reads a non-collapsed selection as start/end regardless of direction', () => {
		const input = makeInput('hello');
		const text = input.firstChild as Node;
		const range = document.createRange();
		range.setStart(text, 1);
		range.setEnd(text, 4);
		const sel = window.getSelection();
		sel?.removeAllRanges();
		sel?.addRange(range);

		expect(getSelectionRange(input)).toEqual({ selectionStart: 1, selectionEnd: 4 });
	});

	it('falls back to the end of the text when the selection is outside the input', () => {
		const input = makeInput('<div>a</div><div>b</div>');
		clearSelection();

		expect(getSelectionRange(input)).toEqual({ selectionStart: 3, selectionEnd: 3 });
	});

	it('returns 0 for an empty composer with a placeholder <br>', () => {
		const input = makeInput('<br>');
		placeCaret(input, 0);

		expect(getSelectionRange(input)).toEqual({ selectionStart: 0, selectionEnd: 0 });
	});
});

describe('setSelectionRange', () => {
	it('round-trips a collapsed caret through get/set on a single text node', () => {
		const input = makeInput('hello world');

		for (let n = 0; n <= 'hello world'.length; n++) {
			setSelectionRange(input, n, n);
			expect(getSelectionRange(input)).toEqual({ selectionStart: n, selectionEnd: n });
		}
	});

	it('round-trips across block boundaries', () => {
		const input = makeInput('<div>a</div><div>b</div>');

		for (let n = 0; n <= 3; n++) {
			setSelectionRange(input, n, n);
			expect(getSelectionRange(input)).toEqual({ selectionStart: n, selectionEnd: n });
		}
	});

	it('round-trips a non-collapsed range', () => {
		const input = makeInput('<div>foo</div><div>bar</div>');

		setSelectionRange(input, 1, 5);
		expect(getSelectionRange(input)).toEqual({ selectionStart: 1, selectionEnd: 5 });
	});

	it('clamps out-of-range offsets to the end of the content', () => {
		const input = makeInput('abc');

		setSelectionRange(input, 99, 99);
		expect(getSelectionRange(input)).toEqual({ selectionStart: 3, selectionEnd: 3 });
	});
});

describe('cross-DOM caret mapping (typing DOM -> rendered DOM)', () => {
	it('maps an offset captured on the browser typing DOM onto the rendered markup DOM', () => {
		// Typing DOM: browser uses <div> wrappers and no literal newlines
		const typing = makeInput('<div>ab</div><div>cd</div>');
		const typedCaret = typing.childNodes[1].firstChild as Node;
		placeCaret(typedCaret, 1);
		const { selectionStart } = getSelectionRange(typing);

		// "ab\ncd" -> caret after "c" is flat offset 4
		expect(selectionStart).toBe(4);

		// Rendered DOM: spans with literal \n
		const rendered = makeInput('<span>ab\n</span><span>cd\n</span>');
		setSelectionRange(rendered, selectionStart, selectionStart);

		expect(getSelectionRange(rendered)).toEqual({ selectionStart: 4, selectionEnd: 4 });
	});

	it('keeps the caret inside inline formatting after render', () => {
		const typing = makeInput('foo bar');
		placeCaret(typing.firstChild as Node, 4);
		const { selectionStart } = getSelectionRange(typing);

		expect(selectionStart).toBe(4);

		const rendered = makeInput('<span>foo <strong>bar</strong>\n</span>');
		setSelectionRange(rendered, selectionStart, selectionStart);

		expect(getSelectionRange(rendered)).toEqual({ selectionStart: 4, selectionEnd: 4 });

		// The caret must land inside the <strong> (start of "bar"), not at the end of the preceding
		// "foo " text node, so typing at the boundary extends the bold run.
		const strong = rendered.querySelector('strong') as HTMLElement;
		const { anchorNode, anchorOffset } = window.getSelection() as Selection;
		expect(strong.contains(anchorNode)).toBe(true);
		expect(anchorNode).toBe(strong.firstChild);
		expect(anchorOffset).toBe(0);
	});
});
