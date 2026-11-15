import {
	TextInput as TextInputComponent,
	Select as SelectComponent,
	CheckBox as CheckBoxComponent,
	ToggleSwitch as ToggleSwitchComponent,
	RadioButton as RadioButtonComponent,
	EmailInput as EmailInputComponent,
	PasswordInput as PasswordInputComponent,
	SearchInput as SearchInputComponent,
	TextAreaInput as TextAreaComponent,
	NumberInput as NumberInputComponent,
	UrlInput as UrlInputComponent,
	AutoComplete as AutoCompleteComponent,
	MultiSelect as MultiSelectComponent,
	MultiSelectFiltered as MultiSelectFilteredComponent,
	Slider as SliderComponent,
} from '@rocket.chat/fuselage';

import { withLabelId, withAriaLabelledBy, withAriaLabelledByAndId, withVisuallyHiddenLabel } from './withLabelHelpers';

// TODO: Some inputs are still not supported due to requiring a different a11y approach

// with id
export const TextInput = withLabelId(TextInputComponent);
export const EmailInput = withLabelId(EmailInputComponent);
export const PasswordInput = withLabelId(PasswordInputComponent);
export const SearchInput = withLabelId(SearchInputComponent);
export const TextAreaInput = withLabelId(TextAreaComponent);
export const NumberInput = withLabelId(NumberInputComponent);
export const UrlInput = withLabelId(UrlInputComponent);

// with aria-labelledby
export const Select = withAriaLabelledBy(SelectComponent);

// with aria-labelledby + id for aria-controls
/**
 * @deprecated Use `MultiSelectFiltered` instead, or `SelectFiltered` from
 * `@rocket.chat/fuselage` for single selection.
 */
export const AutoComplete = withAriaLabelledByAndId(AutoCompleteComponent<any>) as typeof AutoCompleteComponent;
export const MultiSelect = withAriaLabelledByAndId(MultiSelectComponent);
export const MultiSelectFiltered = withAriaLabelledByAndId(MultiSelectFilteredComponent);
export const Slider = withAriaLabelledBy(SliderComponent) as typeof SliderComponent;

// with visually hidden label
export const CheckBox = withVisuallyHiddenLabel(CheckBoxComponent);
export const ToggleSwitch = withVisuallyHiddenLabel(ToggleSwitchComponent);
export const RadioButton = withVisuallyHiddenLabel(RadioButtonComponent);
