import { modal } from './modal';
import { t } from '../../../utils';

export function authorize(appName) {
	const warnText = 'Obtain your Rocket.Chat username, userId and avatar.';

	modal.open({
		title: `${ appName } ${ t('Apply') }`,
		text: warnText ? t(warnText, name) : '',
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: t('Allow'),
		cancelButtonText: t('Cancel'),
		closeOnConfirm: true,
		html: false,
	}, () => true
	);
	return false;
}
