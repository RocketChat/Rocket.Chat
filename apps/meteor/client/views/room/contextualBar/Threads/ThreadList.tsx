import ThreadListView from './ThreadListView';
import { useThreadListData } from './useThreadListData';

const ThreadList = () => {
	const data = useThreadListData();
	return <ThreadListView {...data} />;
};

export default ThreadList;
