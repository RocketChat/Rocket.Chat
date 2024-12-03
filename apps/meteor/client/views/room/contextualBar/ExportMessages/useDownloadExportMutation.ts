import type { IMessage } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { Messages } from '../../../../../app/models/client';
import { downloadJsonAs } from '../../../../lib/download';

export const useDownloadExportMutation = () => {
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: async ({ mids }: { mids: IMessage['_id'][] }) => {
			return Messages.find({
				_id: { $in: mids },
			}).fetch();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: (data) => {
			downloadJsonAs(data, 'exportedMessages');
		},
	});
};
