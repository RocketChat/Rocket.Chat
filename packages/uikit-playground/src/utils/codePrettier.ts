import prettier from 'prettier';
import pluginBabel from 'prettier/parser-babel';

const codePrettier = (code: string, cursor: number) =>
  prettier.formatWithCursor(code, {
    parser: 'json',
    plugins: [pluginBabel],
    tabWidth: 4,
    useTabs: true,
    singleQuote: false,
    cursorOffset: cursor,
  });

export default codePrettier;
