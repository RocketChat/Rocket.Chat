import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { Modal, AnimatedVisibility, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { useMutableCallback, useUniqueId } from '@rocket.chat/fuselage-hooks';
import { kitContext, UiKitComponent, UiKitModal, modalParser } from '@rocket.chat/fuselage-ui-kit';
import { uiKitText } from '@rocket.chat/ui-kit';
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { renderMessageBody } from '../../../app/ui-utils/client';
import { getURL } from '../../../app/utils/lib/getURL';
import * as ActionManager from '../../../app/ui-message/client/ActionManager';

// TODO: move this to fuselage-ui-kit itself
modalParser.text = ({ text, type } = {}) => {
	if (type !== 'mrkdwn') {
		return text;
	}

	return <span dangerouslySetInnerHTML={{ __html: renderMessageBody({ msg: text }) }} />;
};

const textParser = uiKitText({
	plain_text: ({ text }) => text,
	text: ({ text }) => text,
});

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

export function ModalBlock({
	view,
	errors,
	appId,
	onSubmit,
	onClose,
	onCancel,
}) {
	const id = `modal_id_${ useUniqueId() }`;
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
	}, [ref.current, errors]);
	// save focus to restore after close
	const previousFocus = useMemo(() => document.activeElement, []);
	// restore the focus after the component unmount
	useEffect(() => () => previousFocus && previousFocus.focus(), [previousFocus]);
	// Handle Tab, Shift + Tab, Enter and Escape
	const handleKeyDown = useCallback((event) => {
		if (event.keyCode === 13) { // ENTER
			return onSubmit(event);
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
	}, [onClose, onSubmit]);
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
					<Modal.Thumb url={getURL(`/api/apps/${ appId }/icon`)} />
					<Modal.Title>{textParser([view.title])}</Modal.Title>
					<Modal.Close tabIndex={-1} onClick={onClose} />
				</Modal.Header>
				<Modal.Content>
					<Box
						is='form'
						method='post'
						action='#'
						onSubmit={onSubmit}
					>
						<UiKitComponent render={UiKitModal} blocks={view.blocks} />
					</Box>
				</Modal.Content>
				<Modal.Footer>
					<ButtonGroup align='end'>
						{view.close && <Button onClick={onCancel}>{textParser([view.close.text])}</Button>}
						{view.submit && <Button primary onClick={onSubmit}>{textParser([view.submit.text])}</Button>}
					</ButtonGroup>
				</Modal.Footer>
			</Modal>
		</AnimatedVisibility>
	);
}

const useActionManagerState = (initialState) => {
	const [state, setState] = useState(initialState);

	const { viewId } = state;

	useEffect(() => {
		const handleUpdate = ({ type, ...data }) => {
			if (type === 'errors') {
				const { errors } = data;
				setState({ ...state, errors });
				return;
			}

			setState(data);
		};

		ActionManager.on(viewId, handleUpdate);

		return () => {
			ActionManager.off(viewId, handleUpdate);
		};
	}, [viewId]);

	return state;
};

const useValues = (view) => {
	const reducer = useMutableCallback((values, { actionId, payload }) => ({
		...values,
		[actionId]: payload,
	}));

	const initializer = useMutableCallback(() => {
		const filterInputFields = ({ element, elements = [] }) => {
			if (element && element.initialValue) {
				return true;
			}

			if (elements.length && elements.map((element) => ({ element })).filter(filterInputFields).length) {
				return true;
			}
		};

		const mapElementToState = ({ element, blockId, elements = [] }) => {
			if (elements.length) {
				return elements.map((element) => ({ element, blockId })).filter(filterInputFields).map(mapElementToState);
			}
			return [element.actionId, { value: element.initialValue, blockId }];
		};

		return view.blocks
			.filter(filterInputFields)
			.map(mapElementToState)
			.reduce((obj, el) => {
				if (Array.isArray(el[0])) {
					return { ...obj, ...Object.fromEntries(el) };
				}

				const [key, value] = el;
				return { ...obj, [key]: value };
			}, {});
	});

	return useReducer(reducer, null, initializer);
};

function ConnectedModalBlock(props) {
	const state = useActionManagerState(props);

	const {
		appId,
		viewId,
		mid: _mid,
		errors,
		view,
	} = state;

	const [values, updateValues] = useValues(view);

	const groupStateByBlockId = (obj) => Object.entries(obj).reduce((obj, [key, { blockId, value }]) => {
		obj[blockId] = obj[blockId] || {};
		obj[blockId][key] = value;
		return obj;
	}, {});

	const prevent = (e) => {
		if (e) {
			(e.nativeEvent || e).stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();
		}
	};

	const context = {
		action: ({ actionId, appId, value, blockId, mid = _mid }) => ActionManager.triggerBlockAction({
			container: {
				type: UIKitIncomingInteractionContainerType.VIEW,
				id: viewId,
			},
			actionId,
			appId,
			value,
			blockId,
			mid,
		}),
		state: ({ actionId, value, /* ,appId, */ blockId = 'default' }) => {
			updateValues({
				actionId,
				payload: {
					blockId,
					value,
				},
			});
		},
		...state,
		values,
	};

	const handleSubmit = useMutableCallback((e) => {
		prevent(e);
		ActionManager.triggerSubmitView({
			viewId,
			appId,
			payload: {
				view: {
					...view,
					id: viewId,
					state: groupStateByBlockId(values),
				},
			},
		});
	});

	const handleCancel = useMutableCallback((e) => {
		prevent(e);
		return ActionManager.triggerCancel({
			appId,
			viewId,
			view: {
				...view,
				id: viewId,
				state: groupStateByBlockId(values),
			},
		});
	});

	const handleClose = useMutableCallback((e) => {
		prevent(e);
		return ActionManager.triggerCancel({
			appId,
			viewId,
			view: {
				...view,
				id: viewId,
				state: groupStateByBlockId(values),
			},
			isCleared: true,
		});
	});

	return <kitContext.Provider value={context}>
		<ModalBlock
			view={view}
			errors={errors}
			appId={appId}
			onSubmit={handleSubmit}
			onCancel={handleCancel}
			onClose={handleClose}
		/>
	</kitContext.Provider>;
}

export default ConnectedModalBlock;
