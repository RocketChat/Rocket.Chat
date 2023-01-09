import type { ReactElement } from 'react';
import React from 'react';

import { useTabContext } from '../../contexts/ToolboxContext';
import Thread from './Thread';
import ThreadList from './ThreadList';

const Threads = (): ReactElement => {
	const tmid = useTabContext() as string | undefined;

	if (tmid) {
		return <Thread tmid={tmid} />;
	}

	return <ThreadList />;
};

export default Threads;
