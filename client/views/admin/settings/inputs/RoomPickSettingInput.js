import { Box, Field, Flex, Icon } from '@rocket.chat/fuselage';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import React, { useRef, useEffect, useLayoutEffect } from 'react';

import ResetSettingButton from '../ResetSettingButton';

function RoomPickSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}) {
	value = value || [];

	const wrapperRef = useRef();
	const valueRef = useRef(value);

	const handleRemoveRoomButtonClick = (rid) => () => {
		onChangeValue(value.filter(({ _id }) => _id !== rid));
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
							selector: (match) => ({ name: match }),
							sort: 'name',
						},
					],
				},
			},
			wrapperRef.current,
		);

		$('.autocomplete', wrapperRef.current).on('autocompleteselect', (event, doc) => {
			const { current: value } = valueRef;
			onChangeValue([...value.filter(({ _id }) => _id !== doc._id), doc]);
			event.currentTarget.value = '';
			event.currentTarget.focus();
		});

		return () => {
			Blaze.remove(view);
		};
	}, [_id, autocomplete, disabled, onChangeValue, placeholder, readonly, valueRef]);

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
			<div style={{ position: 'relative' }} ref={wrapperRef} />
			<ul className='selected-rooms'>
				{value.map(({ _id, name }) => (
					<li key={_id} className='remove-room' onClick={handleRemoveRoomButtonClick(_id)}>
						{name} <Icon name='cross' />
					</li>
				))}
			</ul>
		</>
	);
}

export default RoomPickSettingInput;
