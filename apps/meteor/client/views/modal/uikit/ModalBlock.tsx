import { Modal, AnimatedVisibility, Button, Box } from '@rocket.chat/fuselage';
import { UiKitComponent, UiKitModal, modalParser } from '@rocket.chat/fuselage-ui-kit';
import * as UiKit from '@rocket.chat/ui-kit';
import type { FormEvent, FormEventHandler, ReactElement } from 'react';
import { useId, useCallback, useEffect, useMemo, useRef } from 'react';
import { FocusScope } from 'react-aria';

import { getButtonStyle } from './getButtonStyle';
import { getURL } from '../../../../app/utils/client/getURL';

const focusableElementsString = `
	a[href]:not([tabindex="-1"]),
	area[href]:not([tabindex="-1"]),
	input:not([disabled]):not([tabindex="-1"]),
	select:not([disabled]):not([tabindex="-1"]),
	textarea:not([disabled]):not([tabindex="-1"]),
	button:not([disabled]):not([tabindex="-1"]),
	iframe,
	object,
	embed,
	[tabindex]:not([tabindex="-1"]),
	[contenteditable]`;

const focusableElementsStringInvalid = `
	a[href]:not([tabindex="-1"]):invalid,
	area[href]:not([tabindex="-1"]):invalid,
	input:not([disabled]):not([tabindex="-1"]):invalid,
	select:not([disabled]):not([tabindex="-1"]):invalid,
	textarea:not([disabled]):not([tabindex="-1"]):invalid,
	button:not([disabled]):not([tabindex="-1"]):invalid,
	iframe:invalid,
	object:invalid,
	embed:invalid,
	[tabindex]:not([tabindex="-1"]):invalid,
	[contenteditable]:invalid`;

type ModalBlockParams = {
	view: UiKit.ModalView;
	errors: any;
	appId: string;
	onSubmit: (event: FormEvent) => void;
	onClose: () => void;
	onCancel: FormEventHandler;
};

const isFocusable = (element: Element | null): element is HTMLElement =>
	element !== null && 'focus' in element && typeof element.focus === 'function';

const KeyboardCode = new Map<string, number>([
	['ENTER', 13],
	['ESC', 27],
	['TAB', 9],
]);

const ModalBlock = ({ view, errors, onSubmit, onClose, onCancel }: ModalBlockParams): ReactElement => {
	const id = `modal_id_${useId()}`;
	const ref = useRef<HTMLElement>(null);

	useEffect(() => {
		if (!ref.current) {
			return;
		}

		if (errors && Object.keys(errors).length) {
			const element = ref.current.querySelector<HTMLElement>(focusableElementsStringInvalid);
			element?.focus();
		} else {
			const element = ref.current.querySelector<HTMLElement>(focusableElementsString);
			element?.focus();
		}
	}, [errors]);

	const previousFocus = useMemo(() => document.activeElement, []);

	useEffect(
		() => () => {
			if (previousFocus && isFocusable(previousFocus)) {
				return previousFocus.focus();
			}
		},
		[previousFocus],
	);

	const formRef = useRef<HTMLFormElement>(null);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			switch (event.keyCode) {
				case KeyboardCode.get('ENTER'):
					if ((event?.target as Node | null)?.nodeName !== 'TEXTAREA') {
						formRef.current?.submit();
						return;
					}
					return;
				case KeyboardCode.get('ESC'):
					event.stopPropagation();
					event.preventDefault();
					onClose();
					return;
				case KeyboardCode.get('TAB'):
					if (!ref.current) {
						return;
					}
					const elements = Array.from(ref.current.querySelectorAll(focusableElementsString)) as HTMLElement[];
					const [first] = elements;
					const last = elements.pop();

					if (!ref.current.contains(document.activeElement)) {
						return first.focus();
					}

					if (event.shiftKey) {
						if (!first || first === document.activeElement) {
							last?.focus();
							event.stopPropagation();
							event.preventDefault();
						}
						return;
					}

					if (!last || last === document.activeElement) {
						first.focus();
						event.stopPropagation();
						event.preventDefault();
					}
			}
		},
		[onClose],
	);

	useEffect(() => {
		const element = document.querySelector('#modal-root') as HTMLElement;
		const container = element.querySelector('.rcx-modal__content') as HTMLElement;
		const close = (e: Event) => {
			if (e.target !== element) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			onClose();
			return false;
		};

		const ignoreIfNotContains = (e: KeyboardEvent) => {
			if (e.target !== element) {
				return;
			}

			if (!container.contains(e.target as HTMLElement)) {
				return;
			}
			return handleKeyDown(e as KeyboardEvent);
		};

		document.addEventListener('keydown', ignoreIfNotContains);
		element.addEventListener('click', close);
		return () => {
			document.removeEventListener('keydown', ignoreIfNotContains);
			element.removeEventListener('click', close);
		};
	}, [handleKeyDown, onClose]);

	return (
		<AnimatedVisibility visibility={AnimatedVisibility.UNHIDING}>
			<FocusScope contain restoreFocus autoFocus>
				<Modal open id={id} ref={ref}>
					<Modal.Header>
						{view.showIcon ? <Modal.Thumb url={getURL(`/api/apps/${view.appId}/icon`)} /> : null}
						<Modal.Title>{modalParser.text(view.title, UiKit.BlockContext.NONE, 0)}</Modal.Title>
						<Modal.Close tabIndex={-1} onClick={onClose} />
					</Modal.Header>
					<Modal.Content>
						<Box ref={formRef} is='form' method='post' action='#' onSubmit={onSubmit}>
							<UiKitComponent render={UiKitModal} blocks={view.blocks} />
						</Box>
					</Modal.Content>
					<Modal.Footer>
						<Modal.FooterControllers>
							{view.close && (
								<Button danger={view.close.style === 'danger'} onClick={onCancel}>
									{modalParser.text(view.close.text, UiKit.BlockContext.NONE, 0)}
								</Button>
							)}
							{view.submit && (
								<Button {...getButtonStyle(view.submit)} onClick={onSubmit}>
									{modalParser.text(view.submit.text, UiKit.BlockContext.NONE, 1)}
								</Button>
							)}
						</Modal.FooterControllers>
					</Modal.Footer>
				</Modal>
			</FocusScope>
		</AnimatedVisibility>
	);
};

export default ModalBlock;
