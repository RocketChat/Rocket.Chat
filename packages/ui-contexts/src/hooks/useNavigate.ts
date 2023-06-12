import { useContext } from 'react';

import { RouterContext } from '../RouterContext';

export const useNavigate = () => {
	const { navigate } = useContext(RouterContext);
	return navigate;
};
