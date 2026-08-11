import { type ComponentProps, Fragment, useContext, useEffect } from 'react';

import { context } from '../../Context';
import persistStore from '../../utils/persistStore';

export type PersistStoreProps = ComponentProps<'div'>;

const PersistStore = (props: PersistStoreProps) => {
	const { state } = useContext(context);

	useEffect(() => {
		const handleBeforeUnload = () => {
			persistStore(state);
		};

		window.onbeforeunload = handleBeforeUnload;

		return () => {
			window.onbeforeunload = null;
		};
	}, [state]);

	return <Fragment {...props} />;
};

export default PersistStore;
