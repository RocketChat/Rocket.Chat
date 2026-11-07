import MediaCallWidgetViewRouter from './MediaCallWidgetViewRouter.js';
import { useMediaCallView } from '../../context/MediaCallViewContext.js';
import useRegisterView from '../../context/useRegisterView.js';

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
