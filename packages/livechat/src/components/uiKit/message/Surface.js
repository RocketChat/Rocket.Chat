import { createContext } from 'preact';
import { memo, useContext } from 'preact/compat';

const SurfaceContext = createContext({
	dispatchAction: () => undefined,
});

const Surface = ({ children, dispatchAction }) =>
	<SurfaceContext.Provider
		children={children}
		value={{
			dispatchAction,
		}}
	/>;

export const useDispatchAction = () =>
	useContext(SurfaceContext).dispatchAction;

export default memo(Surface);
