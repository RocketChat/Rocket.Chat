import type { UsePreferencesOptions } from './logic/usePreferences';
import { usePreferences } from './logic/usePreferences';
import PreferencesView from './views/PreferencesView';

export type PreferencesPageProps = UsePreferencesOptions;

const PreferencesPage = (props: PreferencesPageProps) => {
	const vm = usePreferences(props);

	return <PreferencesView vm={vm} />;
};

export default PreferencesPage;
