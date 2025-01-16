import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import EditSound from './EditSound';
import { FormSkeleton } from '../../../components/Skeleton';

type EditCustomSoundProps = {
	_id: string | undefined;
	onChange?: () => void;
	close?: () => void;
};

function EditCustomSound({ _id, onChange, ...props }: EditCustomSoundProps): ReactElement | null {
	const { t } = useTranslation();
	const getSounds = useEndpoint('GET', '/v1/custom-sounds.list');

	const { data, isPending, refetch } = useQuery({
		queryKey: ['custom-sounds', _id],

		queryFn: async () => {
			const { sounds } = await getSounds({ query: JSON.stringify({ _id }) });

			if (sounds.length === 0) {
				throw new Error(t('No_results_found'));
			}
			return sounds[0];
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
		refetch?.();
	};

	return <EditSound data={data} onChange={handleChange} {...props} />;
}

export default EditCustomSound;
