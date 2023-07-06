type SelectOption = readonly [value: string, label: string, selected?: boolean];

const options: SelectOption[] = [
  ['1', 'Message Preview'],
  ['2', 'Banner Preview'],
  ['3', 'Modal Preview'],
  ['4', 'ContextualBar Preview'],
];

export default options;
