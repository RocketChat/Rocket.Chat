import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import CloseChatModal from './CloseChatModal';
import { FormSkeleton } from '../components/FormSkeleton';

const CloseChatModalData = ({
	departmentId,
	visitorEmail,
	onCancel,
	onConfirm,
}: {
	departmentId: ILivechatDepartment['_id'];
	onCancel: () => void;
	visitorEmail?: string;
	onConfirm: (
		comment?: string,
		tags?: string[],
		preferences?: { omnichannelTranscriptPDF: boolean; omnichannelTranscriptEmail: boolean },
	) => Promise<void>;
}) => {
	const getDepartment = useEndpoint('GET', '/v1/livechat/department/:_id', { _id: departmentId });
	const { data, isPending } = useQuery({
		queryKey: ['/v1/livechat/department/:_id', departmentId],
		queryFn: () => getDepartment({}),
	});

	if (isPending) {
		return <FormSkeleton />;
	}

	return <CloseChatModal onCancel={onCancel} onConfirm={onConfirm} visitorEmail={visitorEmail} department={data?.department} />;
};
export default CloseChatModalData;
