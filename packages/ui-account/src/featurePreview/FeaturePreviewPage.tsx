import { useFeaturePreviewPreferences } from './logic/useFeaturePreviewPreferences';
import FeaturePreviewView from './views/FeaturePreviewView';

const FeaturePreviewPage = () => {
	const vm = useFeaturePreviewPreferences();

	return <FeaturePreviewView vm={vm} />;
};

export default FeaturePreviewPage;
