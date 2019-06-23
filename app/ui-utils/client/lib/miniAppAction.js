import { modal } from './modal';
import { t } from '../../../utils';

export async function authorize(appName) {
	const result = new Promise((resolve) => {
		modal.open({
			title: t('S_apply', appName),
			text: t('Obtain_username_userId_and_avatar'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Allow'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: true,
			html: false,
		}, () => resolve(true),
		() => resolve(false)
		);
	});
	return result;
}
