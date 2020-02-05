import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { UiKitMessage as uiKitMessage, kitContext, UiKitModal as uiKitModal, messageParser, modalParser, UiKitComponent } from '@rocket.chat/fuselage-ui-kit';
import { uiKitText } from '@rocket.chat/ui-kit';
import { Modal, AnimatedVisibility, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';

import { renderMessageBody } from '../../../ui-utils/client';
import { useReactiveValue } from '../../../../client/hooks/useReactiveValue';


const focusableElementsString =	'a[href]:not([tabindex="-1"]), area[href]:not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';

messageParser.text = ({ text, type } = {}) => {
	if (type !== 'mrkdwn') {
		return text;
	}

	return <span dangerouslySetInnerHTML={{ __html: renderMessageBody({ msg: text }) }} />;
};

modalParser.text = messageParser.text;

const contextDefault = {
	action: console.log,
	state: (data) => {
		console.log('state', data);
	},
};
export const messageBlockWithContext = (context) => (props) => {
	const data = useReactiveValue(props.data);
	return (
		<kitContext.Provider value={context}>
			{uiKitMessage(data.blocks)}
		</kitContext.Provider>
	);
};

const textParser = uiKitText(new class {
	plain_text({ text }) {
		return text;
	}

	text({ text }) {
		return text;
	}
}());
const thumb =	'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';

// https://www.w3.org/TR/wai-aria-practices/examples/dialog-modal/dialog.html

export const modalBlockWithContext = ({
	view: {
		title,
		close,
		submit,
	},
	onSubmit,
	onClose,
	onCancel,
	...context
}) => (props) => {
	const id = `modal_id_${ useUniqueId() }`;

	const { view, ...data } = useReactiveValue(props.data);
	const ref = useRef();

	// Auto focus
	useEffect(() => ref.current && ref.current.querySelector(focusableElementsString).focus(), [ref.current]);
	// save fovus to restore after close
	const previousFocus = useMemo(() => document.activeElement, []);
	// restore the focus after the component unmount
	useEffect(() => () => previousFocus && previousFocus.focus(), []);
	// Handle Tab, Shift + Tab, Enter and Escape
	const handleKeyUp = useCallback((event) => {
		if (event.keyCode === 13) { // ENTER
			return onSubmit();
		}

		if (event.keyCode === 27) { // ESC
			event.stopPropagation();
			event.preventDefault();
			onClose();
			return false;
		}

		if (event.keyCode === 9) { // TAB
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
	}, [onSubmit]);
	// Clean the events
	useEffect(() => {
		const element = document.querySelector('.rc-modal-wrapper');
		const close = (e) => {
			if (e.target !== element) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			onClose();
			return false;
		};
		document.addEventListener('keydown', handleKeyUp);
		element.addEventListener('click', close);
		return () => {
			document.removeEventListener('keydown', handleKeyUp);
			element.removeEventListener('click', close);
		};
	}, handleKeyUp);

	return (
		<kitContext.Provider value={{ ...context, ...data }}>
			<AnimatedVisibility visibility={AnimatedVisibility.UNHIDING}>
				<Modal open id={id} ref={ref}>
					<Modal.Header>
						{/* <Modal.Thumb url={`api/apps/${ context.appId }/icon`} /> */}
						<Modal.Thumb url={thumb} />
						<Modal.Title>{textParser([title])}</Modal.Title>
						<Modal.Close tabIndex={-1} onClick={onClose} />
					</Modal.Header>
					<Modal.Content>
						<Box
							is='form'
							method='post'
							action='#'
							onSubmit={onSubmit}
						>
							<UiKitComponent render={uiKitModal} blocks={view.blocks} />
						</Box>
					</Modal.Content>
					<Modal.Footer>
						<ButtonGroup align='end'>
							<Button onClick={onCancel}>{textParser([close.text])}</Button>
							<Button primary onClick={onSubmit}>{textParser([submit.text])}</Button>
						</ButtonGroup>
					</Modal.Footer>
				</Modal>
			</AnimatedVisibility>
		</kitContext.Provider>
	);
};

export const MessageBlock = ({ blocks }, context = contextDefault) => (
	<kitContext.Provider value={context}>
		{uiKitMessage(blocks)}
	</kitContext.Provider>
);
