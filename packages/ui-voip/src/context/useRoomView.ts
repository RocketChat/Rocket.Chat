import { useLayoutEffect } from 'react';

import { useMediaCallContext } from '.';

const useRoomView = () => {
	const { setInRoomView } = useMediaCallContext();

	useLayoutEffect(() => {
		return () => {
			setInRoomView(false);
		};
	}, [setInRoomView]);

	return () => {
		setInRoomView(true);
	};
};

export default useRoomView;
