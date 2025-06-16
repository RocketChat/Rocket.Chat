import { jsonParseLinter } from '@codemirror/lang-json';
import { lintGutter, linter } from '@codemirror/lint';

export default [lintGutter(), linter(jsonParseLinter())];
