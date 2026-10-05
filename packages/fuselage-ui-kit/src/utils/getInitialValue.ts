import type * as UiKit from '@rocket.chat/ui-kit';

export type Value = { value: unknown; blockId?: string };

const hasInitialValue = (element: UiKit.ActionableElement): element is UiKit.ActionableElement & { initialValue: number | string } =>
	'initialValue' in element;

const hasSnakeCaseInitialValue = (element: UiKit.ActionableElement): element is UiKit.ActionableElement & { initial_value: string } =>
	'initial_value' in element;

const hasInitialTime = (element: UiKit.ActionableElement): element is UiKit.ActionableElement & { initialTime: string } =>
	'initialTime' in element;

const hasInitialDate = (element: UiKit.ActionableElement): element is UiKit.ActionableElement & { initialDate: string } =>
	'initialDate' in element;

const hasInitialDateTime = (element: UiKit.ActionableElement): element is UiKit.ActionableElement & { initial_date_time: number } =>
	'initial_date_time' in element;

const hasInitialOption = (element: UiKit.ActionableElement): element is UiKit.ActionableElement & { initialOption: UiKit.Option } =>
	'initialOption' in element;

const hasInitialOptions = (element: UiKit.ActionableElement): element is UiKit.ActionableElement & { initialOptions: UiKit.Option[] } =>
	'initialOptions' in element;

export const getInitialValue = (element: UiKit.ActionableElement) =>
	(hasInitialValue(element) && element.initialValue) ||
	(hasSnakeCaseInitialValue(element) && element.initial_value) ||
	(hasInitialTime(element) && element.initialTime) ||
	(hasInitialDate(element) && element.initialDate) ||
	(hasInitialDateTime(element) && element.initial_date_time) ||
	(hasInitialOption(element) && element.initialOption.value) ||
	(hasInitialOptions(element) && element.initialOptions.map((option) => option.value)) ||
	undefined;
