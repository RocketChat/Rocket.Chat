import type * as UiKit from '@rocket.chat/ui-kit';

export type Value = { value: unknown; blockId?: string };

const hasInitialValue = (
  element: UiKit.ActionableElement
): element is UiKit.ActionableElement & { initialValue: number | string } =>
  'initialValue' in element;

const hasInitialTime = (
  element: UiKit.ActionableElement
): element is UiKit.ActionableElement & { initialTime: string } =>
  'initialTime' in element;

const hasInitialDate = (
  element: UiKit.ActionableElement
): element is UiKit.ActionableElement & { initialDate: string } =>
  'initialDate' in element;

const hasInitialOption = (
  element: UiKit.ActionableElement
): element is UiKit.ActionableElement & { initialOption: UiKit.Option } =>
  'initialOption' in element;

const hasInitialOptions = (
  element: UiKit.ActionableElement
): element is UiKit.ActionableElement & { initialOptions: UiKit.Option[] } =>
  'initialOptions' in element;

export const getInitialValue = (element: UiKit.ActionableElement) =>
  (hasInitialValue(element) && element.initialValue) ||
  (hasInitialTime(element) && element.initialTime) ||
  (hasInitialDate(element) && element.initialDate) ||
  (hasInitialOption(element) && element.initialOption.value) ||
  (hasInitialOptions(element) &&
    element.initialOptions.map((option) => option.value)) ||
  undefined;
