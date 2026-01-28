import { useLayoutEffect } from 'react';

import { useMediaCallContext } from '.';

const useRoomView = () => {
	const { setInRoomView } = useMediaCallContext();

	useLayoutEffect(() => {
		setInRoomView(true);
		return () => {
			setInRoomView(false);
		};
	}, [setInRoomView]);
};

export default useRoomView;
