import type { ReactNode } from 'react';

import MediaCallInstanceProvider from './MediaCallInstanceProvider';
import MediaCallWidgetProvider from './MediaCallWidgetProvider';

type MediaCallProviderProps = {
	children: ReactNode;
};

const MediaCallProvider = ({ children }: MediaCallProviderProps) => {
	return (
		<MediaCallInstanceProvider>
			<MediaCallWidgetProvider />
			{children}
		</MediaCallInstanceProvider>
	);
};

export default MediaCallProvider;
