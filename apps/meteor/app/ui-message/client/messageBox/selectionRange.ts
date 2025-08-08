// TODO: Change the Selection API to support rich text as the current version may support flat text only.
/* Use Selection API to get the selectionStart and selectionEnd from contenteditable div */
export const getSelectionRange = (input: HTMLDivElement): { selectionStart: number; selectionEnd: number } => {
	const selection = window.getSelection();
	if (!selection?.rangeCount) {
		return { selectionStart: 0, selectionEnd: 0 };
	}

	const { anchorNode, focusNode, anchorOffset, focusOffset } = selection;

	const walker = document.createTreeWalker(input, NodeFilter.SHOW_ALL, {
		acceptNode: (node) => {
			if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;

			if (node.nodeType === Node.ELEMENT_NODE) {
				const tag = node.nodeName.toLowerCase();

				// Skip inline tags that don't cause linebreaks
				if (['b', 'i', 'u', 'span', 'strong', 'em', 'small', 'abbr', 'sub', 'sup', 'mark'].includes(tag) && node !== input) {
					return NodeFilter.FILTER_SKIP;
				}

				// Accept block or linebreaking elements
				return NodeFilter.FILTER_ACCEPT;
			}

			// Skip comments or other non-rendered nodes
			return NodeFilter.FILTER_SKIP;
		},
	});

	let currentNode: Node | null;
	let runningOffset = 0;
	let anchorPosition: number | null = null;
	let focusPosition: number | null = null;

	// Traverse the nodes
	while ((currentNode = walker.nextNode())) {
		// If it's an element node, increment the offset
		if (currentNode.nodeType === Node.ELEMENT_NODE) {
			const tag = (currentNode as HTMLElement).tagName.toLowerCase();

			// Linebreak caused by block-level or <br> tags
			runningOffset += 1;

			// Special case: <br> inside an empty block subtract 1
			if (tag === 'br') {
				const parent = currentNode.parentNode;
				if (parent && parent.childNodes.length === 1 && parent.firstChild === currentNode) {
					runningOffset -= 1;
				}
			}
		}

		// If it's a text node, add the text length to the running offset
		if (currentNode.nodeType === Node.TEXT_NODE) {
			runningOffset += currentNode.nodeValue?.length ?? 0;
		}

		// Determine the position for anchor and focus nodes
		if (currentNode === anchorNode) {
			anchorPosition = runningOffset - (currentNode.nodeValue?.length ?? 0) + anchorOffset;
		}

		if (currentNode === focusNode) {
			focusPosition = runningOffset - (currentNode.nodeValue?.length ?? 0) + focusOffset;
		}

		// If both positions are found, exit early
		if (anchorPosition !== null && focusPosition !== null) {
			break;
		}
	}

	// If selection is collapsed, return the same position for both
	if (anchorPosition === focusPosition) {
		return { selectionStart: anchorPosition ?? 0, selectionEnd: anchorPosition ?? 0 };
	}

	// Return the correct start and end selection positions
	return {
		selectionStart: Math.min(anchorPosition ?? 0, focusPosition ?? 0),
		selectionEnd: Math.max(anchorPosition ?? 0, focusPosition ?? 0),
	};
};

/* Use Selection API to set a selection range in contenteditable div */
export const setSelectionRange = (input: HTMLDivElement, selectionStart: number, selectionEnd: number): void => {
	const range = document.createRange();
	const sel = window.getSelection();

	const walker = document.createTreeWalker(input, NodeFilter.SHOW_ALL, null);
	let node: Node | null;

	let runningOffset = 0;
	let startNode: Node | null = null;
	let endNode: Node | null = null;
	let startOffset = 0;
	let endOffset = 0;

	while ((node = walker.nextNode())) {
		if (node.nodeType === Node.TEXT_NODE) {
			const textLength = node.nodeValue?.length ?? 0;

			if (!startNode && runningOffset + textLength >= selectionStart) {
				startNode = node;
				startOffset = selectionStart - runningOffset;
			}

			if (!endNode && runningOffset + textLength >= selectionEnd) {
				endNode = node;
				endOffset = selectionEnd - runningOffset;
			}

			runningOffset += textLength;
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const tag = (node as HTMLElement).tagName.toLowerCase();

			const isInline = ['b', 'i', 'u', 'span', 'strong', 'em', 'small', 'abbr', 'sub', 'sup', 'mark'].includes(tag) && node !== input;
			const isBr = tag === 'br';

			// Check for <div><br></div> to count as one offset unit
			if (isBr && node.parentNode?.nodeName === 'DIV' && node.parentNode.childNodes.length === 1) {
				runningOffset -= 0; // Do Nothing!
			}

			if (!isInline && !isBr) {
				if (!startNode && runningOffset + 1 > selectionStart) {
					startNode = node;
					startOffset = 0;
				}

				if (!endNode && runningOffset + 1 > selectionEnd) {
					endNode = node;
					endOffset = 0;
				}

				runningOffset += 1;
			}

			if (startNode && endNode) break;
		}
	}

	if (startNode && endNode) {
		try {
			range.setStart(startNode, startOffset);
			range.setEnd(endNode, endOffset);
			sel?.removeAllRanges();
			sel?.addRange(range);
		} catch (e) {
			console.warn('Failed to set selection range:', e);
		}
	}
};

export const getCursorSelectionInfo = (
	input: HTMLDivElement,
	{ selectionStart, selectionEnd }: { selectionStart: number; selectionEnd: number },
): {
	start: {
		line: number;
		first: number;
		last: number;
		col: number;
	};
	end: {
		line: number;
		first: number;
		last: number;
		col: number;
	};
} => {
	const text = input.innerText;
	const lines = text.split('\n');

	let charAccumulator = 0;
	let startLine = -1;
	let endLine = -1;
	let startCol = selectionStart;
	let endCol = selectionEnd;
	let startFirst = -1;
	let startLast = -1;
	let endFirst = -1;
	let endLast = -1;

	for (let i = 0; i < lines.length; i++) {
		const lineLength = lines[i].length;

		if (i > 0) {
			// Subtract previous line length (+1 for newline offset)
			const prevLineLength = lines[i - 1].length + 1;
			if (startLine === -1) startCol -= prevLineLength;
			if (endLine === -1) endCol -= prevLineLength;
			// Account for newline
			charAccumulator += 1;
		}
		charAccumulator += lineLength;

		if (startLine === -1 && charAccumulator >= selectionStart) {
			startLine = i;
			startFirst = selectionStart - startCol;
			startLast = charAccumulator;
		}
		if (endLine === -1 && charAccumulator >= selectionEnd) {
			endLine = i;
			endFirst = selectionEnd - endCol;
			endLast = charAccumulator;
		}

		// Exit early if both found
		if (startLine !== -1 && endLine !== -1) {
			break;
		}
	}

	return {
		start: {
			line: startLine,
			first: startFirst,
			last: startLast,
			col: startCol,
		},
		end: {
			line: endLine,
			first: endFirst,
			last: endLast,
			col: endCol,
		},
	};
};
