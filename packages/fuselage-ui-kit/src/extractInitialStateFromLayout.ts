import type * as UiKit from '@rocket.chat/ui-kit';

type Value = { value: unknown; blockId?: string };

type LayoutBlockWithElement = Extract<
  UiKit.LayoutBlock,
  { element: UiKit.BlockElement | UiKit.TextObject }
>;
type LayoutBlockWithElements = Extract<
  UiKit.LayoutBlock,
  { elements: readonly (UiKit.BlockElement | UiKit.TextObject)[] }
>;

const hasElement = (
  block: UiKit.LayoutBlock
): block is LayoutBlockWithElement => 'element' in block;

const hasElements = (
  block: UiKit.LayoutBlock
): block is LayoutBlockWithElements =>
  'elements' in block && Array.isArray(block.elements);

const isActionableElement = (
  element: UiKit.BlockElement | UiKit.TextObject
): element is UiKit.ActionableElement =>
  'actionId' in element && typeof element.actionId === 'string';

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

const getInitialValue = (element: UiKit.ActionableElement) =>
  (hasInitialValue(element) && element.initialValue) ||
  (hasInitialTime(element) && element.initialTime) ||
  (hasInitialDate(element) && element.initialDate) ||
  (hasInitialOption(element) && element.initialOption.value) ||
  (hasInitialOptions(element) &&
    element.initialOptions.map((option) => option.value)) ||
  undefined;

const reduceInitialValuesFromLayoutBlock = (
  state: { [actionId: string]: Value },
  block: UiKit.LayoutBlock
) => {
  if (hasElement(block)) {
    if (isActionableElement(block.element)) {
      state[block.element.actionId] = {
        value: getInitialValue(block.element),
        blockId: block.blockId,
      };
    }
  }

  if (hasElements(block)) {
    for (const element of block.elements) {
      if (isActionableElement(element)) {
        state[element.actionId] = {
          value: getInitialValue(element),
          blockId: block.blockId,
        };
      }
    }
  }

  return state;
};

export const extractInitialStateFromLayout = (blocks: UiKit.LayoutBlock[]) =>
  blocks.reduce(reduceInitialValuesFromLayoutBlock, {});
