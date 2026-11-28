import { Component, createRef } from 'preact';
import type { HTMLAttributes } from 'preact/compat';

import styles from './styles.module.scss';
import { createClassName } from '../../helpers/createClassName';

export type ModalProps = {
	open: boolean;
	animated?: boolean;
	timeout?: number;
	dismissByOverlay?: boolean;
	onDismiss?: () => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'onDismiss'>;

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

class Modal extends Component<ModalProps> {
	static override defaultProps = {
		dismissByOverlay: true,
	};

	mounted = false;

	dialog = createRef<HTMLDivElement>();

	opener: Element | null = null;

	handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			this.triggerDismiss();
			return;
		}
		if (event.key === 'Tab') {
			this.keepFocusInside(event);
		}
	};

	keepFocusInside = (event: KeyboardEvent) => {
		const dialog = this.dialog.current;
		if (!dialog) {
			return;
		}
		const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.hasAttribute('disabled'));
		const first = focusable[0] ?? dialog;
		const last = focusable[focusable.length - 1] ?? dialog;
		const active = document.activeElement;
		if (!dialog.contains(active) || active === dialog || (event.shiftKey ? active === first : active === last)) {
			event.preventDefault();
			(event.shiftKey ? last : first).focus();
		}
	};

	handleTouchStart = () => {
		const { dismissByOverlay } = this.props;
		if (dismissByOverlay) this.triggerDismiss();
	};

	handleMouseDown = () => {
		const { dismissByOverlay } = this.props;
		if (dismissByOverlay) this.triggerDismiss();
	};

	triggerDismiss = () => {
		const { onDismiss } = this.props;
		if (this.mounted) onDismiss?.();
	};

	override componentDidMount() {
		this.mounted = true;
		this.opener = document.activeElement;
		this.dialog.current?.focus();
		window.addEventListener('keydown', this.handleKeyDown, false);
		const { timeout } = this.props;
		if (timeout !== undefined && Number.isFinite(timeout) && timeout > 0) {
			setTimeout(() => this.triggerDismiss(), timeout);
		}
	}

	override componentWillUnmount() {
		this.mounted = false;
		if (this.opener instanceof HTMLElement && this.opener.isConnected) {
			this.opener.focus();
		}
		window.removeEventListener('keydown', this.handleKeyDown, false);
	}

	render = ({ children, animated, open, ...props }: ModalProps) =>
		open ? (
			<div
				data-qa-type='modal-overlay'
				role='presentation'
				className={createClassName(styles, 'modal__overlay')}
				onTouchStart={this.handleTouchStart}
				onMouseDown={this.handleMouseDown}
			>
				<div
					ref={this.dialog}
					role='dialog'
					aria-modal='true'
					tabIndex={-1}
					className={createClassName(styles, 'modal', { animated })}
					{...props}
				>
					{children}
				</div>
			</div>
		) : null;
}

export default Modal;
