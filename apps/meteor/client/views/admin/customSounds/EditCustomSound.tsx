import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import EditSound from './EditSound';
import { FormSkeleton } from '../../../components/Skeleton';

type EditCustomSoundProps = {
	_id: string;
	onChange?: () => void;
	close: () => void;
};

function EditCustomSound({ _id, onChange, close, ...props }: EditCustomSoundProps): ReactElement | null {
	const getSound = useEndpoint('GET', '/v1/custom-sounds.getOne');

	const { data, isPending } = useQuery({
		queryKey: ['custom-sound', _id],
		queryFn: async () => {
			const sound = await getSound({ _id });
			return sound;
		},
		meta: { apiErrorToastMessage: true },
	});

	if (isPending) {
		return <FormSkeleton pi={20} />;
	}

	if (!data) {
		return null;
	}

	const handleChange: () => void = () => {
		onChange?.();
	};

	return <EditSound data={data} close={close} onChange={handleChange} {...props} />;
}

export default EditCustomSound;
