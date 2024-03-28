import type { TFunction } from 'i18next';
import type { FunctionalComponent } from 'preact';
import { route } from 'preact-router';
import { useContext } from 'preact/hooks';
import { withTranslation } from 'react-i18next';

import { StoreContext } from '../../store';
import GDPRAgreement from './component';

const GDPRContainer: FunctionalComponent<{ t: TFunction }> = ({ ref, t }) => {
	const { config: { messages: { dataProcessingConsentText: consentText = '' } = {} } = {}, dispatch } = useContext(StoreContext);

	const handleAgree = async () => {
		await dispatch({ gdpr: { accepted: true } });
		route('/');
	};

	return <GDPRAgreement ref={ref} title={t('gdpr')} dispatch={dispatch} consentText={consentText} onAgree={handleAgree} />;
};

export default withTranslation()(GDPRContainer);
