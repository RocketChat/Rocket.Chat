import ConferencePage from './ConferencePage';
import AuthenticationCheck from '../root/MainLayout/AuthenticationCheck';

const ConferenceRoute = () => {
	return (
		<AuthenticationCheck guest={false}>
			<ConferencePage />
		</AuthenticationCheck>
	);
};

export default ConferenceRoute;
