import { expect } from 'chai';

import hljs, { register } from '../../../../app/markdown/lib/hljs';

const lazyLanguages: string[] = [
	'onec',
	'abnf',
	'accesslog',
	'actionscript',
	'ada',
	'apache',
	'applescript',
	'arduino',
	'armasm',
	'asciidoc',
	'aspectj',
	'autohotkey',
	'autoit',
	'avrasm',
	'awk',
	'axapta',
	'bash',
	'basic',
	'bnf',
	'brainfuck',
	'cal',
	'capnproto',
	'ceylon',
	'clean',
	'clojure',
	'clojure-repl',
	'cmake',
	'coffeescript',
	'coq',
	'cos',
	'cpp',
	'crmsh',
	'crystal',
	'csp',
	'css',
	'd',
	'dart',
	'delphi',
	'diff',
	'django',
	'dns',
	'dockerfile',
	'dos',
	'dsconfig',
	'dts',
	'dust',
	'ebnf',
	'elixir',
	'elm',
	'erb',
	'erlang',
	'excel',
	'fix',
	'flix',
	'fortran',
	'fsharp',
	'gams',
	'gauss',
	'gcode',
	'gherkin',
	'glsl',
	'go',
	'golo',
	'gradle',
	'groovy',
	'haml',
	'handlebars',
	'haskell',
	'haxe',
	'hsp',
	'http',
	'hy',
	'inform7',
	'ini',
	'irpf90',
	'java',
	'javascript',
	'jboss-cli',
	'json',
	'julia',
	'julia-repl',
	'kotlin',
	'lasso',
	'ldif',
	'leaf',
	'less',
	'lisp',
	'livecodeserver',
	'livescript',
	'llvm',
	'lsl',
	'lua',
	'makefile',
	'markdown',
	'mathematica',
	'matlab',
	'maxima',
	'mel',
	'mercury',
	'mipsasm',
	'mizar',
	'perl',
	'mojolicious',
	'monkey',
	'moonscript',
	'n1ql',
	'nginx',
	'nix',
	'nsis',
	'objectivec',
	'ocaml',
	'openscad',
	'oxygene',
	'parser3',
	'pf',
	'php',
	'pony',
	'powershell',
	'processing',
	'profile',
	'prolog',
	'protobuf',
	'puppet',
	'purebasic',
	'python',
	'q',
	'qml',
	'r',
	'rib',
	'roboconf',
	'rsl',
	'ruleslanguage',
	'rust',
	'scala',
	'scheme',
	'scilab',
	'scss',
	'shell',
	'smali',
	'smalltalk',
	'sml',
	'sqf',
	'sql',
	'stan',
	'stata',
	'step21',
	'stylus',
	'subunit',
	'swift',
	'taggerscript',
	'yaml',
	'tap',
	'tcl',
	'thrift',
	'tp',
	'twig',
	'typescript',
	'vala',
	'vbnet',
	'vbscript',
	'verilog',
	'vhdl',
	'vim',
	'x86asm',
	'xl',
	'xquery',
	'zephir',
];

const eagerLanguages = ['markdown', 'clean', 'javascript'];

describe('hljs', () => {
	describe('eagerly registered languages', () => {
		eagerLanguages.forEach((lang) => {
			it(`should register '${lang}' when the module is loaded`, () => {
				expect(hljs.getLanguage(lang)).to.be.an('object');
			});
		});
	});

	describe('register', () => {
		afterEach(() => {
			hljs
				.listLanguages()
				.filter((lang) => !eagerLanguages.includes(lang))
				.forEach((lang) => hljs.unregisterLanguage(lang));
		});

		lazyLanguages.forEach((lang) => {
			it(`should register a syntax definition for '${lang}'`, async () => {
				hljs.unregisterLanguage(lang);

				await register(lang);

				expect(hljs.listLanguages()).to.include(lang);
			});
		});

		['', 'not-a-language'].forEach((lang) => {
			it(`should fall back to plaintext for '${lang}'`, async () => {
				await register(lang);

				expect(hljs.listLanguages()).to.include('plaintext');
			});
		});
	});
});
