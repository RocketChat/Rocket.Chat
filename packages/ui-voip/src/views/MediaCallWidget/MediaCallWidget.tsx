import MediaCallWidgetViewRouter from './MediaCallWidgetViewRouter';
import WidgetDraggableProvider from '../../components/Widget/WidgetDraggableProvider';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import useRegisterView from '../../context/useRegisterView';

const MediaCallWidget = () => {
	const currentViews = useRegisterView('widget');
	const {
		sessionState: { state, hidden },
	} = useMediaCallView();

	if (hidden || !currentViews.includes('widget')) {
		return null;
	}

	if (state === 'closed') {
		return null;
	}

	return (
		<WidgetDraggableProvider>
			<MediaCallWidgetViewRouter />
		</WidgetDraggableProvider>
	);
};

export default MediaCallWidget;
