import type { ReactNode } from 'react';

import { MediaCallInstanceContext, defaultMediaCallInstanceContextValue } from '../context/MediaCallInstanceContext';

const MediaCallInstanceInertProvider = ({ children }: { children: ReactNode }) => (
	<MediaCallInstanceContext.Provider value={defaultMediaCallInstanceContextValue}>{children}</MediaCallInstanceContext.Provider>
);

export default MediaCallInstanceInertProvider;
