import { useFeaturePreviewPreferences } from './logic/useFeaturePreviewPreferences.js';
import FeaturePreviewView from './views/FeaturePreviewView.js';

const FeaturePreviewPage = () => {
	const vm = useFeaturePreviewPreferences();

	return <FeaturePreviewView vm={vm} />;
};

export default FeaturePreviewPage;
