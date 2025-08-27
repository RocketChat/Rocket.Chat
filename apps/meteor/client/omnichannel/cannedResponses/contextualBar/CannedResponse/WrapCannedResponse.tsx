import type { ILivechatDepartment, IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { useSetModal, usePermission } from '@rocket.chat/ui-contexts';
import type { MouseEvent, MouseEventHandler } from 'react';
import { memo } from 'react';

import CannedResponse from './CannedResponse';
import CreateCannedResponse from '../../modals/CreateCannedResponse';

type WrapCannedResponseProps = {
	canUseCannedResponses: boolean;
	cannedItem: IOmnichannelCannedResponse & { departmentName: ILivechatDepartment['name'] };
	onClickBack: MouseEventHandler<HTMLOrSVGElement>;
	canSaveCannedResponses: boolean;
	onClickUse: (e: MouseEvent<HTMLOrSVGElement>, text: string) => void;
	onClose: () => void;
	reload: () => void;
};

const WrapCannedResponse = ({
	canSaveCannedResponses,
	canUseCannedResponses,
	cannedItem,
	onClickBack,
	onClose,
	onClickUse,
	reload,
}: WrapCannedResponseProps) => {
	const setModal = useSetModal();
	const onClickEdit = (): void => {
		setModal(<CreateCannedResponse cannedResponseData={cannedItem} onClose={() => setModal(null)} reloadCannedList={reload} />);
	};

	const canViewAllCannedResponses = usePermission('view-all-canned-responses');

	const canEditCannedResponses =
		canSaveCannedResponses || (canViewAllCannedResponses && cannedItem.scope !== 'global') || cannedItem.scope === 'user';

	return (
		<CannedResponse
			allowEdit={canEditCannedResponses}
			allowUse={canUseCannedResponses}
			data={cannedItem}
			onClickBack={onClickBack}
			onClickEdit={onClickEdit}
			onClose={onClose}
			onClickUse={(e): void => {
				onClickUse(e, cannedItem?.text);
			}}
		/>
	);
};

export default memo(WrapCannedResponse);
