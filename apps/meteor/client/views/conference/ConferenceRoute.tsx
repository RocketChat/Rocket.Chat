import ConferencePage from './ConferencePage';
import AuthenticationCheck from '../root/MainLayout/AuthenticationCheck';

const ConferenceRoute = () => {
	return (
		<AuthenticationCheck guest>
			<ConferencePage />
		</AuthenticationCheck>
	);
};

export default ConferenceRoute;
