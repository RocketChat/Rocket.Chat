import { Box, Button, ButtonGroup, Skeleton, Throbber, InputBox, Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';
import React, { useMemo } from 'react';

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
		return (
			<Box pb={20}>
				<Skeleton mbs={8} />
				<InputBox.Skeleton w='full' />
				<Skeleton mbs={8} />
				<InputBox.Skeleton w='full' />
				<ButtonGroup stretch w='full' mbs={8}>
					<Button disabled>
						<Throbber inheritColor />
					</Button>
					<Button primary disabled>
						<Throbber inheritColor />
					</Button>
				</ButtonGroup>
				<ButtonGroup stretch w='full' mbs={8}>
					<Button danger disabled>
						<Throbber inheritColor />
					</Button>
				</ButtonGroup>
			</Box>
		);
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
