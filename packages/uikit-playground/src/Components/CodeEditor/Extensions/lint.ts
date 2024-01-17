import { esLint } from '@codemirror/lang-javascript';
import { lintGutter, linter } from '@codemirror/lint';
import Linter from 'eslint4b-prebuilt';

export default [lintGutter(), linter(esLint(new Linter()))];
