import type { ReactNode } from 'react';

import MediaCallInstanceProvider from './MediaCallInstanceProvider';
import MediaCallViewProvider from './MediaCallViewProvider';

type MediaCallProviderProps = {
	children: ReactNode;
};

const MediaCallProvider = ({ children }: MediaCallProviderProps) => {
	return (
		<MediaCallInstanceProvider>
			<MediaCallViewProvider />
			{children}
		</MediaCallInstanceProvider>
	);
};

export default MediaCallProvider;
