export const actionWithSingleLineInput = [
  {
    type: 'actions',
    elements: [
      {
        type: 'plain_text_input',
        actionId: 'plain_text_input_1',
        placeholder: {
          type: 'plain_text',
          text: 'Enter name',
          emoji: true,
        },
        initialValue: 'Vivek Srivastava',
        multiline: false,
      },
    ],
  },
];

export const actionWithMultiLineInput = [
  {
    type: 'actions',
    elements: [
      {
        type: 'plain_text_input',
        actionId: 'plain_text_input_1',
        placeholder: {
          type: 'plain_text',
          text: 'Enter name',
          emoji: true,
        },
        initialValue: 'Vivek Srivastava',
        multiline: true,
      },
    ],
  },
];
