import { useTranslation } from 'react-i18next';

import ConferenceStatePage from './ConferenceStatePage.js';

export type ConferenceNotStartedProps = {
	title: string;
	onClose: () => void;
};

/** What a conference link shows while its conference has not started and the viewer cannot start it. */
const ConferenceNotStarted = ({ title, onClose }: ConferenceNotStartedProps) => {
	const { t } = useTranslation();

	return (
		<ConferenceStatePage
			icon='clock'
			variation='neutral'
			title={t('Conference_not_started_yet', { title })}
			subtitle={t('Conference_not_started_yet_description')}
			action={{ label: t('Close'), onClick: onClose }}
		/>
	);
};

export default ConferenceNotStarted;
