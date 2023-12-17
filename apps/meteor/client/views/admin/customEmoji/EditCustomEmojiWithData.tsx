import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';
import React, { useMemo } from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import EditCustomEmoji from './EditCustomEmoji';

type EditCustomEmojiWithDataProps = {
	_id: string;
	close: () => void;
	onChange: () => void;
};

const EditCustomEmojiWithData: FC<EditCustomEmojiWithDataProps> = ({ _id, onChange, close, ...props }) => {
	const t = useTranslation();
	const query = useMemo(() => ({ query: JSON.stringify({ _id }) }), [_id]);

	const getEmojis = useEndpoint('GET', '/v1/emoji-custom.list');

	const { data, isLoading, error, refetch } = useQuery(['custom-emojis', query], async () => {
		const emoji = await getEmojis(query);
		return emoji;
	});

	if (isLoading) {
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
