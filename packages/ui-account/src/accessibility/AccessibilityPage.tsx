import { useAccessibilityPreferences } from './logic/useAccessibilityPreferences.js';
import AccessibilityView from './views/AccessibilityView.js';

const AccessibilityPage = () => {
	const vm = useAccessibilityPreferences();

	return <AccessibilityView vm={vm} />;
};

export default AccessibilityPage;
