import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Modal, Box, Field, FieldLabel, FieldRow, Button, Select } from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery, useMutation } from '@tanstack/react-query';
import { useId, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { dispatchToastMessage } from '../../lib/toast';
import { goToRoomById } from '../../lib/utils/goToRoomById';

type MoveDiscussionProps = {
	onClose: () => void;
	message: IMessage;
};

const ROOM_AUTOCOMPLETE_PARAMS = {
	admin: {
		endpoint: '/v1/rooms.autocomplete.adminRooms',
		key: 'roomsAutoCompleteAdmin',
	},
	regular: {
		endpoint: '/v1/rooms.autocomplete.channelAndPrivate',
		key: 'roomsAutoCompleteRegular',
	},
} as const;

const scope = 'regular';

const MoveDiscussion = ({ message: { _id, drid }, onClose }: MoveDiscussionProps) => {
	const t = useTranslation();
	const modalId = useId();
	const membersId = useId();
	const parentRoomId = useId();
	const getRooms = useEndpoint('GET', ROOM_AUTOCOMPLETE_PARAMS[scope].endpoint);

	const {
		formState: { errors },
		handleSubmit,
		control,
	} = useForm({
		mode: 'onBlur',
		defaultValues: {
			parentRoom: '',
		},
	});

	const moveDiscussion = useEndpoint('POST', '/v1/rooms.moveDiscussion');

	const moveDiscussionMutation = useMutation({
		mutationFn: moveDiscussion,

		onSettled(data) {
			if (data?.discussion?._id) {
				goToRoomById(data.discussion._id);
			} else {
				dispatchToastMessage({
					type: 'error',
					message: t('Error_moving_discussion'),
				});
			}

			onClose();
		},
	});

	const handleMove = async ({ parentRoom }: { parentRoom: IRoom['_id'] }) => {
		if (!drid) {
			return;
		}
		moveDiscussionMutation.mutate({
			prid: parentRoom,
			pmid: _id,
			drid,
		});
	};

	const result = useQuery({
		queryKey: [ROOM_AUTOCOMPLETE_PARAMS[scope].key],
		queryFn: () => getRooms({ selector: JSON.stringify({ name: '' }) }),
		placeholderData: keepPreviousData,
	});

	const options = useMemo(
		(): SelectOption[] => (result.isSuccess ? result.data.items.map(({ name, fname, _id }) => [_id, fname || name || '']) : []),
		[result.data?.items, result.isSuccess],
	);

	return (
		<Modal
			aria-labelledby={`${modalId}-title`}
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleMove)} {...props} />}
		>
			<Modal.Header>
				<Modal.Title id={`${modalId}-title`}>{t('Move_Discussion_title')}</Modal.Title>
				<Modal.Close tabIndex={-1} onClick={onClose} />
			</Modal.Header>

			<Modal.Content>
				<Field>
					<FieldLabel htmlFor={membersId}>{t('Select_Room')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='parentRoom'
							render={({ field: { name, onBlur, onChange, value } }) => (
								<Select
									name={name}
									onBlur={onBlur}
									onChange={onChange}
									value={value}
									id={parentRoomId}
									placeholder={t('Select_Room')}
									options={options}
									// disabled={Boolean(defaultParentRoom)}
									aria-invalid={Boolean(errors.parentRoom)}
									aria-required='true'
									aria-describedby={`${parentRoomId}-error`}
								/>
							)}
						/>
					</FieldRow>
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button type='submit' primary>
						{t('Move')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default MoveDiscussion;
