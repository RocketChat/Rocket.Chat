import MediaCallWidgetViewRouter from './MediaCallWidgetViewRouter';
import WidgetDraggableProvider from '../../components/Widget/WidgetDraggableProvider';
import { useMediaCallInstance } from '../../context';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import useRegisterView from '../../context/useRegisterView';

const MediaCallWidget = () => {
	const { targetWidgetVisibility } = useMediaCallInstance();
	const currentViews = useRegisterView('widget');
	const {
		sessionState: { hidden, state, confirmed },
	} = useMediaCallView();

	// Stay off screen until the server confirms a call this client placed, since the server can still refuse it.
	const widgetVisible = targetWidgetVisibility === 'open' || (state !== 'none' && confirmed);

	if (hidden || !currentViews.has('widget') || !widgetVisible) {
		return null;
	}

	return (
		<WidgetDraggableProvider>
			<MediaCallWidgetViewRouter />
		</WidgetDraggableProvider>
	);
};

export default MediaCallWidget;
