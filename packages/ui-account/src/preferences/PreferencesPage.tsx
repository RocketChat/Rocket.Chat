import type { UsePreferencesOptions } from './logic/usePreferences.js';
import { usePreferences } from './logic/usePreferences.js';
import PreferencesView from './views/PreferencesView.js';

export type PreferencesPageProps = UsePreferencesOptions;

const PreferencesPage = (props: PreferencesPageProps) => {
	const vm = usePreferences(props);

	return <PreferencesView vm={vm} />;
};

export default PreferencesPage;
