import { formatWithCursor } from 'prettier/standalone';
import * as pluginBabel from 'prettier/plugins/babel';
import * as pluginEstree from 'prettier/plugins/estree';

const codePrettier = (code: string, cursor: number) =>
  formatWithCursor(code, {
    parser: 'json',
    plugins: [pluginBabel, pluginEstree],
    tabWidth: 4,
    useTabs: true,
    singleQuote: false,
    cursorOffset: cursor,
  });

export default codePrettier;
