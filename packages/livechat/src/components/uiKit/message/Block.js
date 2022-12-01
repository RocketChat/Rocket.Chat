import { createContext } from 'preact';
import { memo, useContext, useCallback, useState, useRef, useEffect } from 'preact/compat';

import { useDispatchAction } from './Surface';

const BlockContext = createContext({
	appId: null,
	blockId: null,
});

const Block = ({ appId, blockId, children }) => (
	<BlockContext.Provider
		children={children}
		value={{
			appId,
			blockId,
		}}
	/>
);

export const usePerformAction = (actionId) => {
	const { appId } = useContext(BlockContext);
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
					actionId,
					payload,
				});
			} finally {
				if (mountedRef.current) {
					setPerforming(false);
				}
			}
		},
		[actionId, appId, dispatchAction],
	);

	return [perform, performing];
};

export default memo(Block);
