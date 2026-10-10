import type { StoryFn, Meta } from '@storybook/react-webpack5';
import { useState } from 'react';

import { Field, FieldDescription, FieldError, FieldHint, FieldLabel, FieldLabelInfo, FieldLink, FieldRow } from '.';
import {
	TextInput,
	EmailInput,
	PasswordInput,
	SearchInput,
	TextAreaInput,
	Select,
	CheckBox,
	ToggleSwitch,
	RadioButton,
	NumberInput,
	UrlInput,
	MultiSelect,
	Slider,
	AutoComplete,
} from '../Inputs';

export default {
	title: 'Inputs/Field',
	component: Field,
} satisfies Meta<typeof Field>;

export const WithTextInput: StoryFn<typeof Field> = () => (
	<Field>
		<FieldLabel required>
			Example Text Input
			<FieldLabelInfo title='with extra info in a tooltip' />
		</FieldLabel>
		<FieldDescription>Text inputs are used to enter a single line of text.</FieldDescription>
		<FieldRow>
			<TextInput />
		</FieldRow>
		<FieldError>You failed to enter a valid value</FieldError>
		<FieldRow>
			<FieldHint>This should help the user enter a valid value</FieldHint>
			<FieldLink href='#'>Link to more information</FieldLink>
		</FieldRow>
	</Field>
);
export const WithEmailInput: StoryFn<typeof Field> = () => (
	<Field>
		<FieldLabel required>
			Example Email Input
			<FieldLabelInfo title='with extra info in a tooltip' />
		</FieldLabel>
		<FieldDescription>This field requires a valid email address</FieldDescription>
		<FieldRow>
			<EmailInput />
		</FieldRow>
		<FieldError>You failed to enter a valid value</FieldError>
		<FieldRow>
			<FieldHint>This should help the user enter a valid value</FieldHint>
			<FieldLink href='#'>Link to more information</FieldLink>
		</FieldRow>
	</Field>
);
export const WithPasswordInput: StoryFn<typeof Field> = () => (
	<Field>
		<FieldLabel required>
			Example Password Input
			<FieldLabelInfo title='with extra info in a tooltip' />
		</FieldLabel>
		<FieldDescription>This field requires a valid password</FieldDescription>
		<FieldRow>
			<PasswordInput />
		</FieldRow>
		<FieldError>You failed to enter a valid value</FieldError>
		<FieldRow>
			<FieldHint>This should help the user enter a valid value</FieldHint>
			<FieldLink href='#'>Link to more information</FieldLink>
		</FieldRow>
	</Field>
);
export const WithSearchInput: StoryFn<typeof Field> = () => (
	<Field>
		<FieldLabel required>
			Example Search Input
			<FieldLabelInfo title='with extra info in a tooltip' />
		</FieldLabel>
		<FieldDescription>You can use this field to search for things</FieldDescription>
		<FieldRow>
			<SearchInput />
		</FieldRow>
		<FieldError>You failed to enter a valid value</FieldError>
		<FieldRow>
			<FieldHint>This should help the user enter a valid value</FieldHint>
			<FieldLink href='#'>Link to more information</FieldLink>
		</FieldRow>
	</Field>
);
export const WithTextArea: StoryFn<typeof Field> = () => (
	<Field>
		<FieldLabel required>
			Example Text Area
			<FieldLabelInfo title='with extra info in a tooltip' />
		</FieldLabel>
		<FieldDescription>You can use this field to enter multi-line text</FieldDescription>
		<FieldRow>
			<TextAreaInput />
		</FieldRow>
		<FieldError>You failed to enter a valid value</FieldError>
		<FieldRow>
			<FieldHint>This should help the user enter a valid value</FieldHint>
			<FieldLink href='#'>Link to more information</FieldLink>
		</FieldRow>
	</Field>
);
export const WithRadioButton: StoryFn<typeof Field> = () => (
	<Field>
		<FieldRow>
			<FieldLabel required>
				Example Radio Button
				<FieldLabelInfo title='with extra info in a tooltip' />
			</FieldLabel>
			<RadioButton />
		</FieldRow>
		<FieldDescription>You can only select a single option</FieldDescription>
		<FieldError>You failed to enter a valid value</FieldError>
		<FieldRow>
			<FieldHint>This should help the user enter a valid value</FieldHint>
			<FieldLink href='#'>Link to more information</FieldLink>
		</FieldRow>
	</Field>
);
export const WithToggleSwitch: StoryFn<typeof Field> = () => (
	<Field>
		<FieldRow>
			<FieldLabel required>
				Example Toggle Switch
				<FieldLabelInfo title='with extra info in a tooltip' />
			</FieldLabel>
			<ToggleSwitch />
		</FieldRow>
		<FieldDescription>This field represents a boolean value</FieldDescription>
		<FieldError>You failed to enter a valid value</FieldError>
		<FieldRow>
			<FieldHint>This should help the user enter a valid value</FieldHint>
			<FieldLink href='#'>Link to more information</FieldLink>
		</FieldRow>
	</Field>
);
export const WithCheckbox: StoryFn<typeof Field> = () => (
	<Field>
		<FieldRow>
			<FieldLabel required>
				Example Checkbox
				<FieldLabelInfo title='with extra info in a tooltip' />
			</FieldLabel>
			<CheckBox />
		</FieldRow>
		<FieldDescription>You can select multiple options</FieldDescription>
		<FieldError>You failed to enter a valid value</FieldError>
		<FieldRow>
			<FieldHint>This should help the user enter a valid value</FieldHint>
			<FieldLink href='#'>Link to more information</FieldLink>
		</FieldRow>
	</Field>
);

export const WithNumberInput: StoryFn<typeof Field> = () => (
	<Field>
		<FieldLabel required>
			Example Number Input
			<FieldLabelInfo title='with extra info in a tooltip' />
		</FieldLabel>
		<FieldDescription>This field requires a valid number</FieldDescription>
		<FieldRow>
			<NumberInput />
		</FieldRow>
		<FieldError>You failed to enter a valid value</FieldError>
		<FieldRow>
			<FieldHint>This should help the user enter a valid value</FieldHint>
			<FieldLink href='#'>Link to more information</FieldLink>
		</FieldRow>
	</Field>
);

export const WithUrlInput: StoryFn<typeof Field> = () => (
	<Field>
		<FieldLabel required>
			Example URL Input
			<FieldLabelInfo title='with extra info in a tooltip' />
		</FieldLabel>
		<FieldDescription>This field requires a valid URL</FieldDescription>
		<FieldRow>
			<UrlInput />
		</FieldRow>
		<FieldError>You failed to enter a valid value</FieldError>
		<FieldRow>
			<FieldHint>This should help the user enter a valid value</FieldHint>
			<FieldLink href='#'>Link to more information</FieldLink>
		</FieldRow>
	</Field>
);

export const WithSelect: StoryFn<typeof Field> = () => (
	<Field>
		<FieldLabel required>
			Example Select
			<FieldLabelInfo title='with extra info in a tooltip' />
		</FieldLabel>
		<FieldDescription>You can select a single option from a list of options</FieldDescription>
		<FieldRow>
			<Select
				options={[
					['1', 'item 1'],
					['2', 'item 2'],
					['3', 'item 3'],
					['4', 'item 4'],
					['5', 'item 5'],
					['6', 'item 6'],
					['7', 'item 7'],
					['8', 'item 8'],
					['9', 'item 9'],
					['10', 'item 10'],
				]}
			/>
		</FieldRow>
		<FieldError>You failed to enter a valid value</FieldError>
		<FieldRow>
			<FieldHint>This should help the user enter a valid value</FieldHint>
			<FieldLink href='#'>Link to more information</FieldLink>
		</FieldRow>
	</Field>
);

export const WithMultiSelect: StoryFn<typeof Field> = () => {
	const [value, setValue] = useState<string[]>(['1', '3']);
	return (
		<Field>
			<FieldLabel required>
				Example MultiSelect
				<FieldLabelInfo title='with extra info in a tooltip' />
			</FieldLabel>
			<FieldDescription>You can select multiple options from a list of options</FieldDescription>
			<FieldRow>
				<MultiSelect
					options={[
						['1', 'item 1'],
						['2', 'item 2'],
						['3', 'item 3'],
						['4', 'item 4'],
						['5', 'item 5'],
						['6', 'item 6'],
						['7', 'item 7'],
						['8', 'item 8'],
						['9', 'item 9'],
						['10', 'item 10'],
					]}
					value={value}
					onChange={setValue}
				/>
			</FieldRow>
			<FieldError>You failed to enter a valid value</FieldError>
			<FieldRow>
				<FieldHint>This should help the user enter a valid value</FieldHint>
				<FieldLink href='#'>Link to more information</FieldLink>
			</FieldRow>
		</Field>
	);
};

export const WithSlider: StoryFn<typeof Field> = () => {
	const [value, setValue] = useState<number>(20);
	return (
		<Field>
			<FieldLabel required>
				Example Slider
				<FieldLabelInfo title='with extra info in a tooltip' />
			</FieldLabel>
			<FieldDescription>You can use the slider to select a value from a range of values</FieldDescription>
			<FieldRow>
				<Slider value={value} onChange={setValue} />
			</FieldRow>
			<FieldError>You failed to enter a valid value</FieldError>
			<FieldRow>
				<FieldHint>This should help the user enter a valid value</FieldHint>
				<FieldLink href='#'>Link to more information</FieldLink>
			</FieldRow>
		</Field>
	);
};

export const WithAutoComplete: StoryFn<typeof Field> = () => {
	const [filter, setFilter] = useState('');
	const [value, setValue] = useState<string>('');

	const options = [
		{ value: '1', label: 'Option 1' },
		{ value: '2', label: 'Option 2' },
		{ value: '3', label: 'Option 3' },
		{ value: '4', label: 'Option 4' },
		{ value: '5', label: 'Option 5' },
	];

	const handleChange = (newValue: string | string[]) => {
		if (typeof newValue === 'string') {
			setValue(newValue);
		}
	};

	return (
		<Field>
			<FieldLabel required>
				Example AutoComplete
				<FieldLabelInfo title='with extra info in a tooltip' />
			</FieldLabel>
			<FieldDescription>You can search and select a single option from a list</FieldDescription>
			<FieldRow>
				<AutoComplete
					value={value}
					filter={filter}
					setFilter={setFilter}
					options={options}
					onChange={handleChange}
					placeholder='Search...'
				/>
			</FieldRow>
			<FieldError>You failed to enter a valid value</FieldError>
			<FieldRow>
				<FieldHint>This should help the user enter a valid value</FieldHint>
				<FieldLink href='#'>Link to more information</FieldLink>
			</FieldRow>
		</Field>
	);
};

export const WithAutoCompleteMultiple: StoryFn<typeof Field> = () => {
	const [filter, setFilter] = useState('');
	const [value, setValue] = useState<string[]>(['1', '3']);

	const options = [
		{ value: '1', label: 'Option 1' },
		{ value: '2', label: 'Option 2' },
		{ value: '3', label: 'Option 3' },
		{ value: '4', label: 'Option 4' },
		{ value: '5', label: 'Option 5' },
	];

	const handleChange = (newValue: string | string[]) => {
		if (Array.isArray(newValue)) {
			setValue(newValue);
		}
	};

	return (
		<Field>
			<FieldLabel required>
				Example AutoComplete (Multiple)
				<FieldLabelInfo title='with extra info in a tooltip' />
			</FieldLabel>
			<FieldDescription>You can search and select multiple options from a list</FieldDescription>
			<FieldRow>
				<AutoComplete
					multiple
					value={value}
					filter={filter}
					setFilter={setFilter}
					options={options}
					onChange={handleChange}
					placeholder='Search...'
				/>
			</FieldRow>
			<FieldError>You failed to enter a valid value</FieldError>
			<FieldRow>
				<FieldHint>This should help the user enter a valid value</FieldHint>
				<FieldLink href='#'>Link to more information</FieldLink>
			</FieldRow>
		</Field>
	);
};
