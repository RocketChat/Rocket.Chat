import { t } from '../../../../../app/utils/client';
import { appStatusSpanResponseProps } from '../utils/appStatusSpanResponseProps';

const appIncompatibleStatusProps = (): appStatusSpanResponseProps => ({
	icon: 'check',
	label: 'Incompatible',
	tooltipText: t('App_version_incompatible_tooltip'),
});

export default appIncompatibleStatusProps;
