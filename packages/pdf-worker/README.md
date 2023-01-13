# @rocket.chat/pdf-worker

This package is a PDF worker for Rocket.Chat. It allows for the rendering of PDFs within the Rocket.Chat application. `@react-pdf/renderer` is used as the PDF renderer, as it provides a React-based solution for rendering PDFs, making it easy to integrate into the existing React codebase of Rocket.Chat.

## Installation

To install this package, you can use yarn:

```
yarn add @rocket.chat/pdf-worker

yarn install
```

## Usage

To use this package, you will need to import it in your project and use the provided PDF renderer.

```
import { PdfWorker } from '@rocket.chat/pdf-worker';

const PdfWorker = new PdfWorker();
PdfWorker.render('template-mode');
```

## Development

If you wish to contribute to the development of this package, you can clone the repository and run the following commands:

```
yarn dev
```

This will start a development server and allow you to make changes to the code.

## Testing

You can run the tests for this package with the following command:

```
yarn test
```

## Storybook

You can also run Storybook to see the components in action and debug during development:

```
yarn storybook
```

This will start a development server and allow you to see the different components and their states. It also provides a visual representation of the components and how they will look in the final application, making it easy to debug and develop the templates.

## Additional Note

Please refer to the [official documentation](https://docs.rocket.chat/) of @rocket.chat/pdf-worker for more information about this package.
