import type { Item } from '../Components/DropDown/types';
import {
  actionWithButtonDefault,
  actionWithButtonPrimary,
  actionWithButtonDanger,
  actionWithButtonAsLink,
  actionWithMenu,
  // actionWithImage,
  // actionWithSingleLineInput,
  // actionWithMultiLineInput,
  actionWithSingleStaticSelect,
  actionWithMultiStaticSelect,
  actionWithDatePicker,
  actionWithLinearScale,
} from './action';
import {
  contextWithPlainText,
  contextWithMrkdwn,
  contextWithImage,
  contextWithAllElements,
} from './context';
import { divider } from './divider';
import { imageWithTitle, imageWithoutTitle } from './image';
import {
  inputWithSingleLineInput,
  inputWithMultiLineInput,
  inputWithSingleStaticSelect,
  inputWithMultiStaticSelect,
  inputWithDatePicker,
  inputWithLinearSelect,
} from './input';
import {
  previewPlain,
  previewWithImage,
  previewWithUrl,
  previewWithImageAndUrl,
} from './preview';
import {
  sectionWithPlainText,
  sectionWithMrkdwn,
  sectionWithTextFields,
  sectionWithButtonDefault,
  sectionWithButtonPrimary,
  sectionWithButtonDanger,
  sectionWithButtonAsLink,
  sectionWithImage,
  sectionWithMenu,
  sectionWithdatePicker,
} from './section';

const BlocksTree: Item = [
  {
    label: 'actions',
    branches: [
      {
        label: 'button',
        branches: [
          {
            label: 'default',
            payload: actionWithButtonDefault,
          },
          {
            label: 'primary',
            payload: actionWithButtonPrimary,
          },
          {
            label: 'danger',
            payload: actionWithButtonDanger,
          },
          {
            label: 'as Link',
            payload: actionWithButtonAsLink,
          },
        ],
      },

      {
        label: 'static select',
        branches: [
          {
            label: 'Single',
            payload: actionWithSingleStaticSelect,
          },
          {
            label: 'Multi',
            payload: actionWithMultiStaticSelect,
          },
        ],
      },
      {
        label: 'menu',
        payload: actionWithMenu,
      },
      {
        label: 'date Picker',
        payload: actionWithDatePicker,
      },
      {
        label: 'linear scale',
        payload: actionWithLinearScale,
      },
    ],
  },
  {
    label: 'section',
    branches: [
      {
        label: 'text',
        branches: [
          {
            label: 'plain text',
            payload: sectionWithPlainText,
          },
          {
            label: 'mrkdwn',
            payload: sectionWithMrkdwn,
          },
          {
            label: 'text fields',
            payload: sectionWithTextFields,
          },
        ],
      },
      {
        label: 'button',
        branches: [
          {
            label: 'default',
            payload: sectionWithButtonDefault,
          },
          {
            label: 'primary',
            payload: sectionWithButtonPrimary,
          },
          {
            label: 'danger',
            payload: sectionWithButtonDanger,
          },
          {
            label: 'as Link',
            payload: sectionWithButtonAsLink,
          },
        ],
      },
      {
        label: 'image',
        payload: sectionWithImage,
      },
      {
        label: 'menu',
        payload: sectionWithMenu,
      },
      {
        label: 'date Picker',
        payload: sectionWithdatePicker,
      },
    ],
  },
  {
    label: 'preview',
    branches: [
      {
        label: 'plain',
        payload: previewPlain,
      },
      {
        label: 'image',
        payload: previewWithImage,
      },
      {
        label: 'URL',
        payload: previewWithUrl,
      },
      {
        label: 'image and URL',
        payload: previewWithImageAndUrl,
      },
    ],
  },
  {
    label: 'input',
    branches: [
      {
        label: 'textfeild',
        branches: [
          {
            label: 'single line',
            payload: inputWithSingleLineInput,
          },
          {
            label: 'multi line',
            payload: inputWithMultiLineInput,
          },
        ],
      },
      {
        label: 'static select',
        branches: [
          {
            label: 'single',
            payload: inputWithSingleStaticSelect,
          },
          {
            label: 'multi',
            payload: inputWithMultiStaticSelect,
          },
        ],
      },
      {
        label: 'date Picker',
        payload: inputWithDatePicker,
      },
      {
        label: 'linear scale',
        payload: inputWithLinearSelect,
      },
    ],
  },
  {
    label: 'image',
    branches: [
      {
        label: 'with title',
        payload: imageWithTitle,
      },
      {
        label: 'without title',
        payload: imageWithoutTitle,
      },
    ],
  },
  {
    label: 'Context',
    branches: [
      {
        label: 'Plain Text',
        payload: contextWithPlainText,
      },
      {
        label: 'Mrkdwn',
        payload: contextWithMrkdwn,
      },
      {
        label: 'Image',
        payload: contextWithImage,
      },
      {
        label: 'All Elements',
        payload: contextWithAllElements,
      },
    ],
  },
  {
    label: 'Conditional',
    branches: [],
  },
  {
    label: 'divider',
    branches: [
      {
        label: 'Plain',
        payload: divider,
      },
    ],
  },
];

export default BlocksTree;
