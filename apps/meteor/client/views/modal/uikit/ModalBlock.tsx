import type { UiKit } from '@rocket.chat/core-typings';
import { Modal, AnimatedVisibility, Button, Box } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { UiKitComponent, UiKitModal, modalParser } from '@rocket.chat/fuselage-ui-kit';
import type { LayoutBlock } from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import type { FormEventHandler, ReactElement } from 'react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { FocusScope } from 'react-aria';

import { getURL } from '../../../../app/utils/client/getURL';
import { getButtonStyle } from './getButtonStyle';

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
	onSubmit: FormEventHandler<HTMLElement>;
	onClose: () => void;
	onCancel: FormEventHandler<HTMLElement>;
};

const isFocusable = (element: Element | null): element is HTMLElement =>
	element !== null && 'focus' in element && typeof element.focus === 'function';

const KeyboardCode = new Map<string, number>([
	['ENTER', 13],
	['ESC', 27],
	['TAB', 9],
]);

const ModalBlock = ({ view, errors, onSubmit, onClose, onCancel }: ModalBlockParams): ReactElement => {
	const id = `modal_id_${useUniqueId()}`;
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

	const handleKeyDown = useCallback(
		(event) => {
			switch (event.keyCode) {
				case KeyboardCode.get('ENTER'):
					if (event?.target?.nodeName !== 'TEXTAREA') {
						return onSubmit(event);
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
		[onClose, onSubmit],
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

		const ignoreIfNotContains = (e: Event) => {
			if (e.target !== element) {
				return;
			}

			if (!container.contains(e.target as HTMLElement)) {
				return;
			}
			return handleKeyDown(e);
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
						<Modal.Title>{modalParser.text(view.title, BlockContext.NONE, 0)}</Modal.Title>
						<Modal.Close tabIndex={-1} onClick={onClose} />
					</Modal.Header>
					<Modal.Content>
						<Box is='form' method='post' action='#' onSubmit={onSubmit}>
							<UiKitComponent render={UiKitModal} blocks={view.blocks as LayoutBlock[]} />
						</Box>
					</Modal.Content>
					<Modal.Footer>
						<Modal.FooterControllers>
							{view.close && (
								<Button danger={view.close.style === 'danger'} onClick={onCancel}>
									{modalParser.text(view.close.text, BlockContext.NONE, 0)}
								</Button>
							)}
							{view.submit && (
								<Button {...getButtonStyle(view.submit)} onClick={onSubmit}>
									{modalParser.text(view.submit.text, BlockContext.NONE, 1)}
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
