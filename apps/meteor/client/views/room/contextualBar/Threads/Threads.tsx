import { useRoomToolbox } from '@rocket.chat/ui-contexts';

import Thread from './Thread';
import ThreadList from './ThreadList';

const Threads = () => {
	const { context: tmid } = useRoomToolbox();

	if (tmid) {
		return <Thread tmid={tmid} />;
	}

	return <ThreadList />;
};

export default Threads;
