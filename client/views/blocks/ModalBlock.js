import { Modal, AnimatedVisibility, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { UiKitComponent, UiKitModal, modalParser } from '@rocket.chat/fuselage-ui-kit';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { getURL } from '../../../app/utils/lib/getURL';
import './textParsers';

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

function ModalBlock({ view, errors, appId, onSubmit, onClose, onCancel }) {
	const id = `modal_id_${useUniqueId()}`;
	const ref = useRef();

	// Auto focus
	useEffect(() => {
		if (!ref.current) {
			return;
		}

		if (errors && Object.keys(errors).length) {
			const element = ref.current.querySelector(focusableElementsStringInvalid);
			element && element.focus();
		} else {
			const element = ref.current.querySelector(focusableElementsString);
			element && element.focus();
		}
	}, [errors]);
	// save focus to restore after close
	const previousFocus = useMemo(() => document.activeElement, []);
	// restore the focus after the component unmount
	useEffect(() => () => previousFocus && previousFocus.focus(), [previousFocus]);
	// Handle Tab, Shift + Tab, Enter and Escape
	const handleKeyDown = useCallback(
		(event) => {
			if (event.keyCode === 13) {
				// ENTER
				if (event?.target?.nodeName !== 'TEXTAREA') {
					return onSubmit(event);
				}
			}

			if (event.keyCode === 27) {
				// ESC
				event.stopPropagation();
				event.preventDefault();
				onClose();
				return false;
			}

			if (event.keyCode === 9) {
				// TAB
				const elements = Array.from(ref.current.querySelectorAll(focusableElementsString));
				const [first] = elements;
				const last = elements.pop();

				if (!ref.current.contains(document.activeElement)) {
					return first.focus();
				}

				if (event.shiftKey) {
					if (!first || first === document.activeElement) {
						last.focus();
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
	// Clean the events
	useEffect(() => {
		const element = document.querySelector('.rc-modal-wrapper');
		const container = element.querySelector('.rcx-modal__content');
		const close = (e) => {
			if (e.target !== element) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			onClose();
			return false;
		};

		const ignoreIfnotContains = (e) => {
			if (!container.contains(e.target)) {
				return;
			}
			return handleKeyDown(e);
		};

		document.addEventListener('keydown', ignoreIfnotContains);
		element.addEventListener('click', close);
		return () => {
			document.removeEventListener('keydown', ignoreIfnotContains);
			element.removeEventListener('click', close);
		};
	}, [handleKeyDown, onClose]);

	return (
		<AnimatedVisibility visibility={AnimatedVisibility.UNHIDING}>
			<Modal open id={id} ref={ref}>
				<Modal.Header>
					{view.showIcon ? <Modal.Thumb url={getURL(`/api/apps/${appId}/icon`)} /> : null}
					<Modal.Title>{modalParser.text(view.title)}</Modal.Title>
					<Modal.Close tabIndex={-1} onClick={onClose} />
				</Modal.Header>
				<Modal.Content>
					<Box is='form' method='post' action='#' onSubmit={onSubmit}>
						<UiKitComponent render={UiKitModal} blocks={view.blocks} />
					</Box>
				</Modal.Content>
				<Modal.Footer>
					<ButtonGroup align='end'>
						{view.close && <Button onClick={onCancel}>{modalParser.text(view.close.text)}</Button>}
						{view.submit && (
							<Button primary onClick={onSubmit}>
								{modalParser.text(view.submit.text)}
							</Button>
						)}
					</ButtonGroup>
				</Modal.Footer>
			</Modal>
		</AnimatedVisibility>
	);
}

export default ModalBlock;
export { modalParser };
