import { useMediaCallInstance } from '../context';
import MediaCallPopoutWindow from './MediaCallPopoutWindow';

const MediaCallPopout = () => {
	const { currentViews } = useMediaCallInstance();

	if (!currentViews.has('popout')) {
		return null;
	}

	return <MediaCallPopoutWindow />;
};

export default MediaCallPopout;
