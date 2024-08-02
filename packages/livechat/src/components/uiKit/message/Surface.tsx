import type { ComponentChildren } from 'preact';
import { createContext } from 'preact';
import { memo, useContext } from 'preact/compat';

type SurfaceContextValue = {
	dispatchAction: (args: { appId: any; actionId: any; payload: any }) => void;
};

const SurfaceContext = createContext<SurfaceContextValue>({
	dispatchAction: () => undefined,
});

type SurfaceProps = {
	children: ComponentChildren;
	dispatchAction: (action: any) => void;
};

const Surface = ({ children, dispatchAction }: SurfaceProps) => (
	<SurfaceContext.Provider
		children={children}
		value={{
			dispatchAction,
		}}
	/>
);

export const useDispatchAction = () => useContext(SurfaceContext).dispatchAction;

export default memo(Surface);
