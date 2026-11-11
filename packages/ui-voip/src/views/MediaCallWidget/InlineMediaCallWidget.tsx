import InlineMediaCallWidgetContent from './InlineMediaCallWidgetContent';
import MediaCallViewProvider from '../../providers/MediaCallViewProvider';

const InlineMediaCallWidget = () => (
	<MediaCallViewProvider>
		<InlineMediaCallWidgetContent />
	</MediaCallViewProvider>
);

export default InlineMediaCallWidget;
