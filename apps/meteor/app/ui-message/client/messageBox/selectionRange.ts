// TODO: Change the Selection API to support rich text as the current version may support flat text only.

const INLINE_TAGS = new Set([
	'a',
	'abbr',
	'b',
	'bdi',
	'bdo',
	'big',
	'cite',
	'code',
	'del',
	'em',
	'font',
	'i',
	'img',
	'ins',
	'kbd',
	'label',
	'mark',
	'output',
	'q',
	's',
	'samp',
	'small',
	'span',
	'strong',
	'sub',
	'sup',
	'tt',
	'u',
	'var',
	'wbr',
]);

type OffsetEntry = { node: Node; start: number; end: number };

const isPlaceholderBr = (br: Node): boolean => {
	const parent = br.parentNode;
	return Boolean(parent?.childNodes.length === 1 && parent.firstChild === br);
};

// Build a flat character-offset map of the contenteditable mirroring innerText semantics, so the
// caret can be expressed as a single integer that survives the DOM being rewritten by the markdown
// renderer. Text nodes contribute their length; <br> and block-element boundaries contribute one
// newline (blocks only when preceded by content, matching innerText's `a\nb` for `<div>a</div><div>b</div>`);
// inline elements contribute nothing themselves. getSelectionRange and setSelectionRange both consume
// this single model, so the offset measured on the typing DOM always maps back onto the rendered DOM.
const buildOffsetMap = (input: HTMLElement): { entries: OffsetEntry[]; length: number } => {
	const entries: OffsetEntry[] = [];
	let offset = 0;
	let hasContent = false;

	const walk = (node: Node): void => {
		const start = offset;

		if (node.nodeType === Node.TEXT_NODE) {
			const len = node.nodeValue?.length ?? 0;
			offset += len;
			if (len > 0) {
				hasContent = true;
			}
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const tag = (node as HTMLElement).tagName.toLowerCase();

			if (tag === 'br') {
				if (!isPlaceholderBr(node)) {
					offset += 1;
					hasContent = true;
				}
			} else {
				const isInline = INLINE_TAGS.has(tag);
				if (!isInline && hasContent) {
					offset += 1;
				}
				node.childNodes.forEach(walk);
			}
		}

		entries.push({ node, start, end: offset });
	};

	input.childNodes.forEach(walk);

	return { entries, length: offset };
};

/* Use Selection API to get the selectionStart and selectionEnd from contenteditable div */
export const getSelectionRange = (input: HTMLDivElement): { selectionStart: number; selectionEnd: number } => {
	const selection = window.getSelection();

	// When the composer is blurred the DOM selection lives outside the input; fall back to the end of
	// the text so inserts (e.g. emoji picker) append instead of collapsing to offset 0.
	if (!selection?.rangeCount || !selection.anchorNode || !input.contains(selection.anchorNode)) {
		const { length } = buildOffsetMap(input);
		return { selectionStart: length, selectionEnd: length };
	}

	const { entries, length } = buildOffsetMap(input);

	const flatOf = (node: Node, nodeOffset: number): number => {
		if (node.nodeType === Node.TEXT_NODE) {
			const entry = entries.find((e) => e.node === node);
			return (entry?.start ?? 0) + nodeOffset;
		}

		const { childNodes } = node;
		if (nodeOffset < childNodes.length) {
			const child = childNodes[nodeOffset];
			const entry = entries.find((e) => e.node === child);
			return entry?.start ?? 0;
		}

		if (node === input) {
			return length;
		}
		const entry = entries.find((e) => e.node === node);
		return entry?.end ?? length;
	};

	const anchorFlat = flatOf(selection.anchorNode, selection.anchorOffset);
	const focusFlat = flatOf(selection.focusNode ?? selection.anchorNode, selection.focusOffset);

	return {
		selectionStart: Math.min(anchorFlat, focusFlat),
		selectionEnd: Math.max(anchorFlat, focusFlat),
	};
};

/* Use Selection API to set a selection range in contenteditable div */
export const setSelectionRange = (input: HTMLDivElement, selectionStart: number, selectionEnd: number): void => {
	const sel = window.getSelection();
	if (!sel) {
		return;
	}

	const { entries, length } = buildOffsetMap(input);
	const clamp = (n: number): number => Math.max(0, Math.min(n, length));

	const locate = (target: number): { node: Node; offset: number } => {
		// Prefer landing inside the text node that spans the offset. End is exclusive so a boundary
		// offset resolves to the start of the following node (e.g. inside a <strong>) rather than the
		// end of the preceding one, keeping the caret within the formatting the user is extending.
		for (const entry of entries) {
			if (entry.node.nodeType === Node.TEXT_NODE && target >= entry.start && target < entry.end) {
				return { node: entry.node, offset: target - entry.start };
			}
		}

		// No text spans it (empty line / block boundary): anchor before the most specific node that
		// starts exactly here, e.g. a placeholder <br> so the caret can rest on an otherwise-empty line.
		let best: OffsetEntry | null = null;
		for (const entry of entries) {
			if (entry.node === input || entry.start !== target) {
				continue;
			}
			if (!best || entry.end - entry.start <= best.end - best.start) {
				best = entry;
			}
		}
		if (best?.node.parentNode) {
			const parent = best.node.parentNode;
			const index = Array.prototype.indexOf.call(parent.childNodes, best.node);
			return { node: parent, offset: index };
		}

		// Final fallback: a text node ending exactly at the offset. The exclusive primary lookup skips
		// these so boundaries can prefer the following node, but at a true end-of-content position this
		// is the only valid landing spot.
		for (const entry of entries) {
			if (entry.node.nodeType === Node.TEXT_NODE && target === entry.end) {
				return { node: entry.node, offset: entry.node.nodeValue?.length ?? 0 };
			}
		}

		const texts = entries.filter((e) => e.node.nodeType === Node.TEXT_NODE);
		if (texts.length) {
			const last = texts[texts.length - 1];
			if (target >= last.end) {
				return { node: last.node, offset: last.node.nodeValue?.length ?? 0 };
			}
			return { node: texts[0].node, offset: 0 };
		}

		return { node: input, offset: 0 };
	};

	const startPos = locate(clamp(selectionStart));
	const endPos = locate(clamp(selectionEnd));
	const range = document.createRange();

	try {
		range.setStart(startPos.node, startPos.offset);
		range.setEnd(endPos.node, endPos.offset);
		sel.removeAllRanges();
		sel.addRange(range);
	} catch (e) {
		// On a mapping mismatch, park the caret at the end of the input rather than dropping it entirely.
		try {
			range.selectNodeContents(input);
			range.collapse(false);
			sel.removeAllRanges();
			sel.addRange(range);
		} catch {
			console.warn('Failed to set selection range:', e);
		}
	}
};
