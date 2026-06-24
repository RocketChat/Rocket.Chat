import { useMediaCallView, useMediaCallInstance } from '../../../context';
import { useAppActionOverrides } from '../context/AppActionOverridesContext';
import { useMediaCallAppActions } from '../context/MediaCallAppActionsContext';

export type VisibleAppAction = {
	key: string;
	label: string;
	variant?: 'danger' | 'default';
	disabled?: boolean;
	onClick: () => Promise<void>;
};

export const useVisibleAppActions = (): VisibleAppAction[] => {
	const {
		sessionState: { callId, state: currentCallState },
	} = useMediaCallView();
	const appActions = useMediaCallAppActions();
	const { openRoomId } = useMediaCallInstance();
	const { overrides, setOverride } = useAppActionOverrides();

	if (currentCallState !== 'ringing' && currentCallState !== 'calling' && currentCallState !== 'ongoing') {
		return [];
	}

	// Merge persisted overrides into the base action descriptors so that
	// AppActionButton is always initialised with the latest label/variant/actionId,
	// even after being remounted due to a widget-state transition.
	return appActions.actions
		.filter(({ callStates }) => !callStates || callStates.includes(currentCallState))
		.map((action) => {
			const { appId, actionId, ...overridden } = { ...action, ...overrides[action.key] };

			const onClick = async () => {
				setOverride(action.key, { disabled: true });

				const interaction = {
					button: { appId, actionId },
					sessionState: { callId, roomId: openRoomId },
				};

				const result = await appActions.handleInteraction(interaction).catch(() => {
					/* safety net */
				});

				const disabled = result?.update?.disabled ?? false;

				setOverride(action.key, { ...result?.update, disabled });
			};

			return {
				key: action.key,
				label: overridden.label,
				variant: overridden.variant,
				disabled: overridden.disabled,
				onClick,
			};
		});
};
