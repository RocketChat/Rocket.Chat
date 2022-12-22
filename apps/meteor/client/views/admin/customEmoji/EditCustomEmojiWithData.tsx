import { Box, Button, ButtonGroup, Skeleton, Throbber, InputBox, Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useMemo } from 'react';

import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import EditCustomEmoji from './EditCustomEmoji';

type EditCustomEmojiWithDataProps = {
	_id: string;
	close: () => void;
	onChange: () => void;
};

const EditCustomEmojiWithData: FC<EditCustomEmojiWithDataProps> = ({ _id, onChange, close, ...props }) => {
	const t = useTranslation();
	const query = useMemo(() => ({ query: JSON.stringify({ _id }) }), [_id]);

	const {
		value: data = {
			emojis: {
				update: [],
			},
		},
		phase: state,
		error,
		reload,
	} = useEndpointData('/v1/emoji-custom.list', query);

	if (state === AsyncStatePhase.LOADING) {
		return (
			<Box pb='x20'>
				<Skeleton mbs='x8' />
				<InputBox.Skeleton w='full' />
				<Skeleton mbs='x8' />
				<InputBox.Skeleton w='full' />
				<ButtonGroup stretch w='full' mbs='x8'>
					<Button disabled>
						<Throbber inheritColor />
					</Button>
					<Button primary disabled>
						<Throbber inheritColor />
					</Button>
				</ButtonGroup>
				<ButtonGroup stretch w='full' mbs='x8'>
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
		reload?.();
	};

	return <EditCustomEmoji data={data.emojis.update[0]} close={close} onChange={handleChange} {...props} />;
};

export default EditCustomEmojiWithData;
