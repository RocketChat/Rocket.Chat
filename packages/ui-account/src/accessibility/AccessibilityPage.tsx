import { useAccessibilityPreferences } from './logic/useAccessibilityPreferences';
import AccessibilityView from './views/AccessibilityView';

const AccessibilityPage = () => {
	const vm = useAccessibilityPreferences();

	return <AccessibilityView vm={vm} />;
};

export default AccessibilityPage;
