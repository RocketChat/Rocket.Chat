import { type ComponentProps, Fragment, useContext, useEffect } from 'react';

import { context } from '../../Context';
import persistStore from '../../utils/persistStore';

const PersistStore = (props: ComponentProps<'div'>) => {
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
