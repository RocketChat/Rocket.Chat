import { modal } from '../../../../ui-utils/client/lib/modal';
import { t } from '../../../../utils';
import '../../views/invitingOthersDialog/invitingOthers';

export async function invitingOthers() {
	return new Promise((resolve) => {
		modal.open({
			title: t('Invite Your Friends to Join'),
			content: 'InvitingOthers',
			showCancelButton: false,
			confirmButtonColor: '#1D74F5',
			closeOnConfirm: true,
			html: false,
		}, () => resolve(true),
		() => resolve(false)
		);
	});
}
