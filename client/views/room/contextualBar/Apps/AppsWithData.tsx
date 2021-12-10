import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { kitContext } from '@rocket.chat/fuselage-ui-kit';
import React, { memo, useState, useEffect, useReducer } from 'react';

import {
	getLastUserInteractionPayload,
	triggerBlockAction,
	triggerCancel,
	triggerSubmitView,
	on,
	off,
} from '../../../../../app/ui-message/client/ActionManager';
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
	const closeTabBar = useTabBarClose();

	const [state, setState] = useState({});
	const [view, setView] = useState({ blocks: [] });
	const [viewId, setViewId] = useState();
	const [appId, setAppId] = useState();
	const [_mid, setMid] = useState();
	const [values, updateValues] = useValues(view);

	const handleUpdate = ({ type, ...data }) => {
		if (type === 'errors') {
			const { errors } = data;
			setState((state) => ({ ...state, errors }));
			return;
		}

		setState(data);
	};

	useEffect(() => {
		setState(getLastUserInteractionPayload());
		if (Object.entries(state).length) {
			setView(state.view);
			setViewId(state.viewId);
			setAppId(state.appId);
			setMid(state.mid);

			on(viewId, handleUpdate);
			on('close-apps-contextual-bar', closeTabBar);

			return () => {
				off(viewId, handleUpdate);
				off('close-apps-contextual-bar', closeTabBar);
			};
		}
	}, [view, viewId, appId, state, closeTabBar]);

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

	const handleSubmit = useMutableCallback((e) => {
		prevent(e);
		triggerSubmitView({
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
		return triggerCancel({
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
		return triggerCancel({
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
			<Apps
				handleSubmit={handleSubmit}
				handleClose={handleClose}
				handleCancel={handleCancel}
				view={view}
			/>
		</kitContext.Provider>
	);
};

export default memo(AppsWithData);
