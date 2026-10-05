import { getSelectionRange } from './selectionRange';

export type ComposerHistoryEntry = {
	text: string;
	selectionStart: number;
	selectionEnd: number;
};

export type ComposerHistory = {
	undo(): void;
	redo(): void;
	release(): void;
};

type EntryKind = 'insert' | 'delete' | 'newline' | 'paste' | 'programmatic';

const isMacOS = (): boolean => navigator.platform.indexOf('Mac') !== -1;

// Empty contenteditable normalizes between '' and '\n' depending on the render/reducer path,
// so treat both as the same state when deduping snapshots.
const normalize = (text: string): string => (text === '\n' ? '' : text);

const classify = (event: Event): EntryKind => {
	if (!(event instanceof InputEvent) || !event.inputType) {
		return 'programmatic';
	}

	const { inputType } = event;

	if (inputType.startsWith('delete')) {
		return 'delete';
	}

	if (inputType === 'insertParagraph' || inputType === 'insertLineBreak') {
		return 'newline';
	}

	if (inputType === 'insertFromPaste' || inputType === 'insertFromDrop' || inputType === 'insertReplacementText') {
		return 'paste';
	}

	return 'insert';
};

export const createComposerHistory = ({
	input,
	applyState,
	coalesceTimeout = 1000,
	limit = 100,
	now = Date.now,
}: {
	input: HTMLDivElement;
	applyState: (entry: ComposerHistoryEntry) => void;
	coalesceTimeout?: number;
	limit?: number;
	now?: () => number;
}): ComposerHistory => {
	const snapshot = (): ComposerHistoryEntry => {
		const { selectionStart, selectionEnd } = getSelectionRange(input);
		return { text: input.innerText, selectionStart, selectionEnd };
	};

	const undoStack: ComposerHistoryEntry[] = [];
	const redoStack: ComposerHistoryEntry[] = [];

	let current = snapshot();
	let lastKind: EntryKind | null = null;
	let lastAt = now();
	// Force a boundary on the first edit so the initial (seeded) state becomes the first undo target.
	let breakNext = true;
	let applying = false;
	let composing = false;
	// The selection captured just before an edit (from keydown/beforeinput, while the pre-edit
	// selection is still live). Used to detect discontinuous edits — a moved caret or a replaced
	// range — which start a new undo step, and to anchor the undo entry at the edit location.
	let preEditSelection: { start: number; end: number } | null = null;

	const sameState = (a: ComposerHistoryEntry, b: ComposerHistoryEntry): boolean =>
		normalize(a.text) === normalize(b.text) && a.selectionStart === b.selectionStart && a.selectionEnd === b.selectionEnd;

	const commit = (): void => {
		undoStack.push(current);
		if (undoStack.length > limit) {
			undoStack.shift();
		}
		redoStack.length = 0;
	};

	const apply = (entry: ComposerHistoryEntry): void => {
		applying = true;
		try {
			applyState(entry);
		} finally {
			applying = false;
		}
		current = entry;
		lastKind = null;
		lastAt = now();
		breakNext = true;
		preEditSelection = null;
	};

	const undo = (): void => {
		if (!undoStack.length) {
			return;
		}
		redoStack.push(current);
		apply(undoStack.pop() as ComposerHistoryEntry);
	};

	const redo = (): void => {
		if (!redoStack.length) {
			return;
		}
		undoStack.push(current);
		apply(redoStack.pop() as ComposerHistoryEntry);
	};

	const onInput = (event: Event): void => {
		if (applying || composing) {
			return;
		}

		const kind = classify(event);
		const next = snapshot();

		if (sameState(next, current)) {
			return;
		}

		// A change that only moves the caret (same text, different selection) is not its own undo
		// step. Absorb the new selection into the current entry. This prevents a ghost step when an
		// operation re-selects text after editing it, e.g. wrapSelection inserting '*bold*' and then
		// re-selecting 'bold' fires two input events with identical text but different selections.
		if (normalize(next.text) === normalize(current.text)) {
			current = next;
			return;
		}

		const pause = now() - lastAt > coalesceTimeout;
		const kindChanged = lastKind !== null && kind !== lastKind;
		const alwaysBreak = kind === 'paste' || kind === 'newline';

		// A discontinuous edit — the caret moved away from where the last edit left it, or a range was
		// selected and replaced — starts a new undo step. Anchor the committed entry at the edit
		// location so undo restores the caret there.
		const preSel = preEditSelection;
		preEditSelection = null;
		const discontinuous = !!preSel && (preSel.start !== current.selectionStart || preSel.end !== current.selectionEnd);
		if (preSel) {
			current = { ...current, selectionStart: preSel.start, selectionEnd: preSel.end };
		}

		if (breakNext || kindChanged || alwaysBreak || pause || discontinuous) {
			commit();
		}

		current = next;
		lastKind = kind;
		lastAt = now();

		// A whitespace insertion closes the current word group; the next character starts a new
		// undo step. Paste/newline/programmatic changes are always their own step.
		const whitespaceInsert = kind === 'insert' && /\s/.test((event as InputEvent).data ?? '');
		breakNext = alwaysBreak || kind === 'programmatic' || whitespaceInsert;
	};

	// Capture the selection just before an edit, while it is still the pre-edit selection.
	const capturePreEditSelection = (): void => {
		if (applying || composing) {
			return;
		}
		const { selectionStart, selectionEnd } = getSelectionRange(input);
		preEditSelection = { start: selectionStart, end: selectionEnd };
	};

	// Runs on the capture phase (document) so it fires before the composer's own keydown handler
	// triggers execCommand (e.g. the Cmd+B formatting shortcut) synchronously, capturing the range
	// that is about to be replaced.
	const onDocumentKeyDownCapture = (event: KeyboardEvent): void => {
		const target = event.target as Node | null;
		if (target !== input && !(target && input.contains(target))) {
			return;
		}
		capturePreEditSelection();
	};

	const onKeyDown = (event: KeyboardEvent): void => {
		if (event.altKey) {
			return;
		}

		const mod = isMacOS() ? event.metaKey : event.ctrlKey;
		if (!mod) {
			return;
		}

		const key = event.key.toLowerCase();

		if (key === 'z' && !event.shiftKey) {
			event.preventDefault();
			undo();
			return;
		}

		if ((key === 'z' && event.shiftKey) || (key === 'y' && !isMacOS())) {
			event.preventDefault();
			redo();
		}
	};

	// Best-effort: the Edit/context-menu undo. Rarely fires because rewriting innerHTML on each
	// render empties the native history stack, so keydown is the primary path.
	const onBeforeInput = (event: InputEvent): void => {
		if (event.inputType === 'historyUndo') {
			event.preventDefault();
			undo();
			return;
		}
		if (event.inputType === 'historyRedo') {
			event.preventDefault();
			redo();
			return;
		}

		// beforeinput fires before the DOM mutation with the pre-edit selection still live, covering
		// programmatic edits (execCommand) that have no preceding keydown, e.g. the formatting toolbar.
		capturePreEditSelection();
	};

	const onCompositionStart = (): void => {
		composing = true;
	};

	const onCompositionEnd = (): void => {
		composing = false;
		const next = snapshot();
		if (sameState(next, current)) {
			return;
		}
		// A whole IME composition collapses into a single undo step.
		commit();
		current = next;
		lastKind = null;
		lastAt = now();
		breakNext = true;
		preEditSelection = null;
	};

	document.addEventListener('keydown', onDocumentKeyDownCapture, true);
	input.addEventListener('input', onInput);
	input.addEventListener('keydown', onKeyDown);
	input.addEventListener('beforeinput', onBeforeInput as EventListener);
	input.addEventListener('compositionstart', onCompositionStart);
	input.addEventListener('compositionend', onCompositionEnd);

	const release = (): void => {
		document.removeEventListener('keydown', onDocumentKeyDownCapture, true);
		input.removeEventListener('input', onInput);
		input.removeEventListener('keydown', onKeyDown);
		input.removeEventListener('beforeinput', onBeforeInput as EventListener);
		input.removeEventListener('compositionstart', onCompositionStart);
		input.removeEventListener('compositionend', onCompositionEnd);
	};

	return { undo, redo, release };
};
