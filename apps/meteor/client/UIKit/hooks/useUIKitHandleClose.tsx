import type { UIKitInteractionType } from '@rocket.chat/apps-engine/definition/uikit';
import type { UiKitPayload } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';

import { useUiKitActionManager } from '../../hooks/useUiKitActionManager';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const emptyFn = (_error: any, _result: UIKitInteractionType | void): void => undefined;

const useUIKitHandleClose = <S extends UiKitPayload>(state: S, fn = emptyFn): (() => Promise<void | UIKitInteractionType>) => {
	const actionManager = useUiKitActionManager();
	const dispatchToastMessage = useToastMessageDispatch();
	return useMutableCallback(() =>
		actionManager
			.triggerCancel({
				appId: state.appId,
				viewId: state.viewId,
				view: {
					...state,
					id: state.viewId,
				},
				isCleared: true,
			})
			.then((result) => fn(undefined, result))
			.catch((error) => {
				dispatchToastMessage({ type: 'error', message: error });
				fn(error, undefined);
				return Promise.reject(error);
			}),
	);
};

export { useUIKitHandleClose };
