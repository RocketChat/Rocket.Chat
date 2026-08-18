import { Component } from 'preact';
import type { HTMLAttributes } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

export type ModalProps = {
	open: boolean;
	animated?: boolean;
	timeout?: number;
	dismissByOverlay?: boolean;
	onDismiss?: () => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'onDismiss'>;

class Modal extends Component<ModalProps> {
	static override defaultProps = {
		dismissByOverlay: true,
	};

	mounted = false;

	handleKeyDown = ({ key }: KeyboardEvent) => {
		if (key === 'Escape') {
			this.triggerDismiss();
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
		window.addEventListener('keydown', this.handleKeyDown, false);
		const { timeout } = this.props;
		if (timeout !== undefined && Number.isFinite(timeout) && timeout > 0) {
			setTimeout(() => this.triggerDismiss(), timeout);
		}
	}

	override componentWillUnmount() {
		this.mounted = false;
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
				<div className={createClassName(styles, 'modal', { animated })} {...props}>
					{children}
				</div>
			</div>
		) : null;
}

export default Modal;
