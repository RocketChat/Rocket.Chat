import type { ComponentChildren } from 'preact';
import { Component } from 'preact';
import type { CSSProperties } from 'preact/compat';

import { createClassName } from '../../helpers/createClassName';
import { parse } from '../../helpers/parse';
import DOMPurify from 'dompurify';
import styles from './styles.scss';
const findLastTextNode = (node: Node): Node | null => {
	if (node.nodeType === Node.TEXT_NODE) {
		return node;
	}
	const children = node.childNodes;
	for (let i = children.length - 1; i >= 0; i--) {
		const textNode = findLastTextNode(children[i]);
		if (textNode !== null) {
			return textNode;
		}
	}

	return null;
};

const replaceCaret = (el: Element) => {
	// Place the caret at the end of the element
	const target = findLastTextNode(el);
	// do not move caret if element was not focused
	const isTargetFocused = document.activeElement === el;
	if (!!target?.nodeValue && isTargetFocused) {
		const range = document.createRange();
		const sel = window.getSelection();
		range.setStart(target, target.nodeValue.length);
		range.collapse(true);
		sel?.removeAllRanges();
		sel?.addRange(range);
		if (el instanceof HTMLElement) {
			el.focus();
		}
	}
};

type ComposerProps = {
	className?: string;
	style?: CSSProperties;
	value?: string;
	onChange?: (value: string) => void;
	onSubmit?: (value: string) => void;
	onUpload?: (files: (File | null)[]) => void;
	handleEmojiClick?: () => void;
	placeholder?: string;
	pre?: ComponentChildren;
	post?: ComponentChildren;
	notifyEmojiSelect?: (cb: (emoji: string) => void) => void;
	limitTextLength?: number;
};

type ComposerState = {
	inputLock: boolean;
};

export class Composer extends Component<ComposerProps, ComposerState> {
	private el: HTMLElement | null = null;

	handleRef = (el: HTMLDivElement | null) => {
		this.el = el;
	};

	handleInput = (onChange?: (value: string) => void) => () => {
		if (this.state.inputLock) {
			return;
		}
		onChange?.(this.el?.innerText ?? '');
	};

	handleKeypress = (onSubmit?: (value: string) => void) => (event: KeyboardEvent) => {
		if (event.which === 13 && !event.shiftKey) {
			event.preventDefault();
			if (this.el) {
				onSubmit?.(this.el.innerText);
				this.el.innerText = '';
			}
		}
	};

	handlePaste = (onUpload?: (files: (File | null)[]) => void) => async (event: ClipboardEvent) => {
		if (!event.clipboardData?.items) {
			return;
		}

		event.preventDefault();

		const items = Array.from(event.clipboardData.items);

		const files = items.filter((item) => item.kind === 'file' && /^image\//.test(item.type)).map((item) => item.getAsFile());
		if (files.length) {
			onUpload?.(files);
			return;
		}

		const texts = await Promise.all(
			items
				.filter((item) => item.kind === 'string' && /^text\/plain/.test(item.type))
				.map((item) => new Promise<string>((resolve) => item.getAsString(resolve))),
		);

		texts.forEach((text) => this.pasteText(parse(text)));
	};

	handleDrop = (onUpload?: (files: (File | null)[]) => void) => async (event: DragEvent) => {
		if (!event.dataTransfer?.items) {
			return;
		}

		event.preventDefault();

		const items = Array.from(event.dataTransfer.items);

		const files = items.filter((item) => item.kind === 'file' && /^image\//.test(item.type)).map((item) => item.getAsFile());
		if (files.length) {
			onUpload?.(files);
			return;
		}

		const texts = await Promise.all(
			items
				.filter((item) => item.kind === 'string' && /^text\/plain/.test(item.type))
				.map((item) => new Promise<string>((resolve) => item.getAsString(resolve))),
		);
		texts.forEach((text) => this.pasteText(parse(text)));
	};

	handleClick = () => {
		const { handleEmojiClick } = this.props;
		handleEmojiClick?.();
	};

	pasteText = (plainText: string) => {
		this.el?.focus();

		if (document.queryCommandSupported('insertText')) {
			document.execCommand('insertText', false, plainText);
			return;
		}

		const range = document.getSelection()?.getRangeAt(0);
		if (!range) {
			return;
		}

		range.deleteContents();
		const textNode = document.createTextNode(plainText);
		range.insertNode(textNode);
		range.selectNodeContents(textNode);
		range.collapse(false);

		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
	};

	private value: string | undefined;

	constructor(props: ComposerProps) {
		super(props);
		this.state = {
			inputLock: false,
		};
		this.value = this.props.value;
		this.handleNotifyEmojiSelect = this.handleNotifyEmojiSelect.bind(this);

		if (typeof this.props.notifyEmojiSelect === 'function') {
			this.props.notifyEmojiSelect(this.handleNotifyEmojiSelect);
		}
	}

	// we only update composer if value length changed from 0 to 1 or 1 to 0
	// everything else is managed by this.el
	shouldComponentUpdate({ value: nextValue = '' }: ComposerProps) {
		const { value = '', limitTextLength } = this.props;

		const nextValueEmpty = !nextValue || nextValue.length === 0;
		const valueEmpty = !value || value.length === 0;

		if (nextValueEmpty !== valueEmpty) {
			return true;
		}

		if (nextValue.length === limitTextLength || value.length === limitTextLength) {
			return true;
		}

		return false;
	}

	componentDidUpdate() {
		const { el } = this;
		if (!el) {
			return;
		}

		if (this.props.value !== el.innerHTML) {
			this.value = this.props.value ?? '';
			el.innerHTML = this.value;
		}
		replaceCaret(el);
	}

	handleNotifyEmojiSelect(emoji: string) {
		if (!this.el) {
			throw new Error('Composer: handleNotifyEmojiSelect called but el is not defined');
		}

		const { onChange } = this.props;
		const caretPosition = this.getCaretPosition(this.el);
		const oldText = this.el?.innerText ?? '';
		const newText = `${oldText.slice(0, caretPosition)}${emoji}&nbsp;${oldText.slice(caretPosition)}`;
		this.el.innerHTML = DOMPurify.sanitize(newText);
		this.moveCursorToEndAndFocus(caretPosition + emoji.length + 1);
		onChange?.(this.el.innerText);
	}

	moveCursorToEndAndFocus(endIndex: number) {
		if (!this.el) {
			throw new Error('Composer: moveCursorToEndAndFocus called but el is not defined');
		}

		const setPos = document.createRange();
		const set = window.getSelection();
		setPos.setStart(this.el.childNodes[0], endIndex);
		setPos.collapse(true);
		set?.removeAllRanges();
		set?.addRange(setPos);
	}

	getCaretPosition(element: HTMLElement) {
		const doc = element.ownerDocument || element.document;
		const win = doc.defaultView || doc.parentWindow;

		if (!win) {
			throw new Error('Composer: getCaretPosition called but win is not defined');
		}

		if (typeof win.getSelection !== 'undefined' && (win.getSelection()?.rangeCount ?? 0) > 0) {
			const range = win.getSelection()?.getRangeAt(0) as Range;
			const preCaretRange = range.cloneRange();
			preCaretRange.selectNodeContents(element);
			preCaretRange.setEnd(range.endContainer, range.endOffset);
			return preCaretRange.toString().length;
		}

		if (doc.selection && doc.selection.type !== 'Control') {
			const textRange = doc.selection.createRange?.();
			const preCaretTextRange = doc.body.createTextRange?.();
			preCaretTextRange?.moveToElementText?.(element);
			preCaretTextRange?.setEndPoint?.('EndToEnd', textRange as Range);
			return preCaretTextRange?.text?.length ?? 0;
		}

		return 0;
	}

	handleInputLock(locked: boolean) {
		this.setState({ inputLock: locked });
		return 0;
	}

	render = ({ pre, post, value, placeholder, onChange, onSubmit, onUpload, className, style }: ComposerProps) => (
		<div className={createClassName(styles, 'composer', {}, [className])} style={style}>
			{pre}
			<div
				ref={this.handleRef}
				contentEditable
				data-placeholder={placeholder}
				data-qa='livechat-composer'
				onInput={this.handleInput(onChange)}
				onKeyPress={this.handleKeypress(onSubmit)}
				onPaste={this.handlePaste(onUpload)}
				onDrop={this.handleDrop(onUpload)}
				onClick={this.handleClick}
				onCompositionStart={() => {
					this.handleInputLock(true);
				}}
				onCompositionEnd={() => {
					this.handleInputLock(false);
					onChange?.(this.el?.innerText ?? '');
				}}
				className={createClassName(styles, 'composer__input')}
			>
				{value}
			</div>
			{post}
		</div>
	);
}

export { ComposerAction } from './ComposerAction';
export { ComposerActions } from './ComposerActions';
