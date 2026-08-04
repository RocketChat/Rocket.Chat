import { useSetting } from '@rocket.chat/ui-contexts';

import CustomHomePage from './CustomHomePage';
import DefaultHomePage from './DefaultHomePage';

const HomePage = () => {
	const customOnly = useSetting('Layout_Custom_Body_Only');

	if (customOnly) {
		return <CustomHomePage />;
	}

	return <DefaultHomePage />;
};

export default HomePage;
