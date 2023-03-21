import type { SettingValueRoomPick } from '@rocket.chat/core-typings';
import { Box, Field, Flex } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import type { ReactElement, MutableRefObject } from 'react';
import React, { useRef, useEffect, useLayoutEffect } from 'react';

import RoomAutoCompleteMultiple from '../../../../components/RoomAutoComplete/RoomAutoCompleteMultiple';
import ResetSettingButton from '../ResetSettingButton';

type RoomPickSettingInputProps = {
	_id: string;
	label: string;
	value?: SettingValueRoomPick;
	placeholder?: string;
	readonly?: boolean;
	autocomplete?: boolean;
	disabled?: boolean;
	hasResetButton?: boolean;
	onChangeValue: (value: string[]) => void;
	onResetButtonClick?: () => void;
};

function RoomPickSettingInput({
	_id,
	label,
	value = [],
	placeholder,
	readonly,
	autocomplete,
	disabled,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: RoomPickSettingInputProps): ReactElement {
	value = value || [];

	const wrapperRef = useRef() as MutableRefObject<HTMLDivElement>;
	const valueRef = useRef(value);

	const handleRemoveRoomButtonClick = (rid: string) => (): void => {
		onChangeValue?.((value || []).filter(({ _id }) => _id !== rid));
	};

	useLayoutEffect(() => {
		valueRef.current = value;
	});

	useEffect(() => {
		const view = Blaze.renderWithData(
			Template.inputAutocomplete,
			{
				id: _id,
				name: _id,
				class: 'search autocomplete rc-input__element',
				autocomplete: autocomplete === false ? 'off' : undefined,
				readOnly: readonly,
				placeholder,
				disabled,
				settings: {
					limit: 10,
					// inputDelay: 300
					rules: [
						{
							// @TODO maybe change this 'collection' and/or template
							collection: 'CachedChannelList',
							endpoint: 'rooms.autocomplete.channelAndPrivate',
							field: 'name',
							template: Template.roomSearch,
							noMatchTemplate: Template.roomSearchEmpty,
							matchAll: true,
							selector: (match: string): { name: string } => ({ name: match }),
							sort: 'name',
						},
					],
				},
			},
			wrapperRef.current,
		);

		$('.autocomplete', wrapperRef.current).on('autocompleteselect', (event, doc) => {
			const { current: value } = valueRef;
			onChangeValue?.([...(value || []).filter(({ _id }) => _id !== doc._id), doc]);
			(event.currentTarget as HTMLInputElement).value = '';
			event.currentTarget.focus();
		});

		return (): void => {
			Blaze.remove(view);
		};
	}, [_id, autocomplete, disabled, onChangeValue, placeholder, readonly, valueRef]);

	const handleChangeRooms = useMutableCallback((currentValue, action) => {
		if (!action) {
			if (value.includes(currentValue)) {
				return;
			}
			return onChangeValue([...value, currentValue]);
		}
		onChangeValue(value.filter((current) => current !== currentValue));
	});

	return (
		<>
			<Flex.Container>
				<Box>
					<Field.Label htmlFor={_id} title={_id}>
						{label}
					</Field.Label>
					{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
				</Box>
			</Flex.Container>
			<Field.Row>
				<RoomAutoCompleteMultiple
					readOnly={readonly}
					placeholder={placeholder}
					disabled={disabled}
					value={value}
					onChange={handleChangeRooms}
				/>
			</Field.Row>
			{/* <div style={{ position: 'relative' }} ref={wrapperRef} />
			<ul className='selected-rooms'>
				{value?.map(({ _id, name }) => (
					<li key={_id} className='remove-room' onClick={handleRemoveRoomButtonClick(_id)}>
						{name} <Icon name='cross' />
					</li>
				))}
			</ul> */}
		</>
	);
}

export default RoomPickSettingInput;
