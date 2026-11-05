import InlineMediaCallWidgetContent from './InlineMediaCallWidgetContent.js';
import MediaCallViewProvider from '../../providers/MediaCallViewProvider.js';

const InlineMediaCallWidget = () => (
	<MediaCallViewProvider>
		<InlineMediaCallWidgetContent />
	</MediaCallViewProvider>
);

export default InlineMediaCallWidget;
