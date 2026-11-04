import { type ComponentChildren, createContext } from 'preact';
import { memo, useContext, useCallback, useState, useRef, useEffect } from 'preact/compat';

import { useDispatchAction } from './Surface';

const BlockContext = createContext<{ appId?: string; blockId?: string }>({
	appId: undefined,
	blockId: undefined,
});

export type BlockProps = {
	appId?: string;
	blockId?: string;
	children: ComponentChildren;
};

const Block = ({ appId, blockId, children }: BlockProps) => (
	<BlockContext.Provider
		value={{
			appId,
			blockId,
		}}
	>
		{children}
	</BlockContext.Provider>
);

export const useBlockActionDispatcher = (actionId: string) => {
	const { appId, blockId } = useContext(BlockContext);
	const dispatchAction = useDispatchAction();

	return useCallback((payload = {}) => dispatchAction({ appId, blockId, actionId, payload }), [actionId, appId, blockId, dispatchAction]);
};

export const usePerformAction = (actionId: string) => {
	const { appId, blockId } = useContext(BlockContext);
	const dispatchAction = useDispatchAction();

	const [performing, setPerforming] = useState(false);
	const mountedRef = useRef(true);

	useEffect(
		() => () => {
			mountedRef.current = false;
		},
		[],
	);

	const perform = useCallback(
		async (payload = {}) => {
			setPerforming(true);

			try {
				await dispatchAction({
					appId,
					blockId,
					actionId,
					payload,
				});
			} finally {
				if (mountedRef.current) {
					setPerforming(false);
				}
			}
		},
		[actionId, appId, blockId, dispatchAction],
	);

	return [perform, performing] as const;
};

export default memo(Block);
