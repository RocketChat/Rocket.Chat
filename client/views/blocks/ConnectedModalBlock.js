import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { kitContext } from '@rocket.chat/fuselage-ui-kit';
import React, { useEffect, useReducer, useState } from 'react';

import * as ActionManager from '../../../app/ui-message/client/ActionManager';
import ModalBlock from './ModalBlock';
import './textParsers';

const useActionManagerState = (initialState) => {
	const [state, setState] = useState(initialState);

	const { viewId } = state;

	useEffect(() => {
		const handleUpdate = ({ type, ...data }) => {
			if (type === 'errors') {
				const { errors } = data;
				setState((state) => ({ ...state, errors }));
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
				return elements
					.map((element) => ({ element, blockId }))
					.filter(filterInputFields)
					.map(mapElementToState);
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

	const { appId, viewId, mid: _mid, errors, view } = state;

	const [values, updateValues] = useValues(view);

	const groupStateByBlockId = (obj) =>
		Object.entries(obj).reduce((obj, [key, { blockId, value }]) => {
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
		action: ({ actionId, appId, value, blockId, mid = _mid }) =>
			ActionManager.triggerBlockAction({
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

	return (
		<kitContext.Provider value={context}>
			<ModalBlock view={view} errors={errors} appId={appId} onSubmit={handleSubmit} onCancel={handleCancel} onClose={handleClose} />
		</kitContext.Provider>
	);
}

export default ConnectedModalBlock;
