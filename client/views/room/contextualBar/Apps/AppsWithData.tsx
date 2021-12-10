import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { kitContext } from '@rocket.chat/fuselage-ui-kit';
import React, { memo, useState, useEffect, useReducer } from 'react';

import { getLastUserInteractionPayload, triggerBlockAction, on, off } from '../../../../../app/ui-message/client/ActionManager';
import { useTabBarClose } from '../../providers/ToolboxProvider';
import Apps from './Apps';

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

			if (
				elements.length &&
				elements.map((element) => ({ element })).filter(filterInputFields).length
			) {
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

const AppsWithData = () => {
	const onClose = useTabBarClose();

	const [state, setState] = useState({});
	const [view, setView] = useState({ blocks: [] });
	const [viewId, setViewId] = useState();
	const [ _mid, setMid ] = useState();
	const [values, updateValues] = useValues(view);

	useEffect(() => {
		const handleUpdate = ({ type, ...data }) => {
			if (type === 'errors') {
				const { errors } = data;
				setState((state) => ({ ...state, errors }));
				return;
			}

			setState(data);
		};

		setState(getLastUserInteractionPayload());
		if (Object.entries(state).length) {
			setView(state.view);
			setViewId(state.viewId);
			setMid(state.mid);

			on(viewId, handleUpdate);

			return () => {
				off(viewId, handleUpdate);
			};
		}
	}, [view, viewId, state]);

	const context = {
		action: ({ actionId, appId, value, blockId, mid = _mid }) =>
			triggerBlockAction({
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

	return (
		<kitContext.Provider value={context}>
			<Apps onClose={onClose} view={view} />
		</kitContext.Provider>
	);
};

export default memo(AppsWithData);
