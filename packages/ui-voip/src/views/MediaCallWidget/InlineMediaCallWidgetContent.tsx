import MediaCallWidgetViewRouter from './MediaCallWidgetViewRouter';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import useRegisterView from '../../context/useRegisterView';

const InlineMediaCallWidgetContent = () => {
	const currentViews = useRegisterView('inline-widget');
	const {
		sessionState: { hidden },
	} = useMediaCallView();

	if (hidden || !currentViews.has('inline-widget')) {
		return null;
	}

	return <MediaCallWidgetViewRouter />;
};

export default InlineMediaCallWidgetContent;
