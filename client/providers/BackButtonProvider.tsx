import React, { useMemo, FC, useState } from 'react';

import { BackButtonContext } from '../contexts/BackButtonContext';

const BackButtonProvider: FC = ({ children }) => {
	const [backButtonPath, setbackButtonPath] = useState('');
	const contextValue = useMemo(
		() => ({
			backButtonPath,
			setbackButtonPath,
		}),
		[backButtonPath],
	);

	return <BackButtonContext.Provider children={children} value={contextValue} />;
};

export default BackButtonProvider;
