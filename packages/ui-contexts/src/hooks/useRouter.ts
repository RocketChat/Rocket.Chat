import { useContext } from 'react';

import { RouterContext } from '../RouterContext.js';

export const useRouter = () => useContext(RouterContext);
