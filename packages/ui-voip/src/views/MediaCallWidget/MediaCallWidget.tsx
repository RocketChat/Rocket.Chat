import MediaCallWidgetViewRouter from './MediaCallWidgetViewRouter';
import WidgetDraggableProvider from '../../components/Widget/WidgetDraggableProvider';
import { useMediaCallInstance } from '../../context';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import useRegisterView from '../../context/useRegisterView';

const MediaCallWidget = () => {
	const { widgetVisibility } = useMediaCallInstance();
	const currentViews = useRegisterView('widget');
	const {
		sessionState: { hidden },
	} = useMediaCallView();

	if (hidden || !currentViews.includes('widget') || widgetVisibility === 'closed') {
		return null;
	}

	return (
		<WidgetDraggableProvider>
			<MediaCallWidgetViewRouter />
		</WidgetDraggableProvider>
	);
};

export default MediaCallWidget;
