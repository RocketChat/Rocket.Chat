import { useLayoutEffect } from 'react';

import { useMediaCallInstance } from '.';

const useRoomView = () => {
	const { setInRoomView } = useMediaCallInstance();

	useLayoutEffect(() => {
		setInRoomView(true);
		return () => {
			setInRoomView(false);
		};
	}, [setInRoomView]);
};

export default useRoomView;
