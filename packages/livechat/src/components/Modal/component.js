import { Component } from 'preact';
import { withTranslation } from 'react-i18next';

import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { createClassName } from '../helpers';
import styles from './styles.scss';


export class Modal extends Component {
	static defaultProps = {
		dismissByOverlay: true,
	}

	handleKeyDown = ({ key }) => {
		if (key === 'Escape') {
			this.triggerDismiss();
		}
	}

	handleTouchStart = () => {
		const { dismissByOverlay } = this.props;
		dismissByOverlay && this.triggerDismiss();
	}

	handleMouseDown = () => {
		const { dismissByOverlay } = this.props;
		dismissByOverlay && this.triggerDismiss();
	}

	triggerDismiss = () => {
		const { onDismiss } = this.props;
		this.mounted && onDismiss && onDismiss();
	}

	componentDidMount() {
		this.mounted = true;
		window.addEventListener('keydown', this.handleKeyDown, false);
		const { timeout } = this.props;
		if (Number.isFinite(timeout) && timeout > 0) {
			setTimeout(() => this.triggerDismiss(), timeout);
		}
	}

	componentWillUnmount() {
		this.mounted = false;
		window.removeEventListener('keydown', this.handleKeyDown, false);
	}

	render = ({ children, animated, open, ...props }) => (
		open ? (
			<div
				onTouchStart={this.handleTouchStart}
				onMouseDown={this.handleMouseDown}
				className={createClassName(styles, 'modal__overlay')}
			>
				<div className={createClassName(styles, 'modal', { animated })} {...props}>{children}</div>
			</div>
		) : null
	)
}


export const ModalMessage = ({ children }) => (
	<div className={createClassName(styles, 'modal__message')} id='chat-confirmation-modal'>
		{children}
	</div>
);


export class ConfirmationModal extends Component {
	handleRef = (ref) => {
		this.confirmationModalRef = ref;
	}

	getFocusableElements = () => this.confirmationModalRef.base.querySelectorAll(
		'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select',
	)

	handleKeyDown = (e) => {
		const { key } = e;

		switch (key) {
			case 'Tab':
				this.handleTabKey(e);
				break;
			case 'Escape':
				this.props.onCancel();
				break;
			default:
				break;
		}

		e.stopPropagation();
	}

	handleTabKey = (e) => {
		const focusableElements = this.getFocusableElements();

		if (focusableElements.length > 0) {
			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			if (focusableElements.length === 1) {
				firstElement.focus();
				return e.preventDefault();
			}

			if (!e.shiftKey && document.activeElement !== firstElement) {
				firstElement.focus();
				return e.preventDefault();
			}

			if (e.shiftKey && document.activeElement !== lastElement) {
				lastElement.focus();
				return e.preventDefault();
			}
		}
	};

	componentDidMount() {
		const focusableElements = this.getFocusableElements();
		focusableElements[0].focus();
	}

	render = ({

		text,
		confirmButtonText,
		cancelButtonText,
		onConfirm,
		onCancel,
		t,
		...props
	}) => (
	    <Modal open animated dismissByOverlay={false} onkeydown={this.handleKeyDown} ref={this.handleRef} role='dialog' aria-describedby='chat-confirmation-modal' {...props}>
			<Modal.Message>{text}</Modal.Message>
			<ButtonGroup>
				<Button outline secondary onClick={onCancel}>{cancelButtonText || t('no')}</Button>
				<Button secondaryDanger onClick={onConfirm}>{confirmButtonText || t('yes')}</Button>
			</ButtonGroup>
		</Modal>
	)
}

export const AlertModal = withTranslation()(({ text, buttonText, onConfirm, t, ...props }) => (
	<Modal open animated dismissByOverlay={false} {...props}>
		<Modal.Message>{text}</Modal.Message>
		<ButtonGroup>
			<Button secondary onClick={onConfirm}>{buttonText || t('ok')}</Button>
		</ButtonGroup>
	</Modal>
));


Modal.Message = ModalMessage;
Modal.Confirm = ConfirmationModal;
Modal.Alert = AlertModal;


export default Modal;
