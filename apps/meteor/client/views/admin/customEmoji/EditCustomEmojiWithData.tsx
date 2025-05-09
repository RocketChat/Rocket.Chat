import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import EditCustomEmoji from './EditCustomEmoji';
import { FormSkeleton } from '../../../components/Skeleton';

type EditCustomEmojiWithDataProps = {
	_id: string;
	close: () => void;
	onChange: () => void;
};

const EditCustomEmojiWithData = ({ _id, onChange, close, ...props }: EditCustomEmojiWithDataProps) => {
	const { t } = useTranslation();
	const query = useMemo(() => ({ _id }), [_id]);

	const getEmojis = useEndpoint('GET', '/v1/emoji-custom.list');

	const { data, isPending, error, refetch } = useQuery({
		queryKey: ['custom-emojis', query],

		queryFn: async () => {
			const emoji = await getEmojis(query);
			return emoji;
		},
	});

	if (isPending) {
		return <FormSkeleton pi={20} />;
	}

	if (error || !data || !data.emojis || data.emojis.update.length < 1) {
		return <Callout title={t('Custom_Emoji_Error_Invalid_Emoji')} type='danger' />;
	}

	const handleChange = (): void => {
		onChange?.();
		refetch?.();
	};

	return <EditCustomEmoji data={data.emojis.update[0]} close={close} onChange={handleChange} {...props} />;
};

export default EditCustomEmojiWithData;
