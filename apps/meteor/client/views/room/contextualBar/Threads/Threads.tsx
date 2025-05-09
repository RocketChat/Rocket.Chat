import Thread from './Thread';
import ThreadList from './ThreadList';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

const Threads = () => {
	const { context: tmid } = useRoomToolbox();

	if (tmid) {
		return <Thread tmid={tmid} />;
	}

	return <ThreadList />;
};

export default Threads;
