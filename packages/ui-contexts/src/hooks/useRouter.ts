import { useContext } from 'react';

import { RouterContext } from '../RouterContext';

export const useRouter = () => useContext(RouterContext);
