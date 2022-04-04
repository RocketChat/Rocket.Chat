import hljs from 'highlight.js/lib/highlight';
import clean from 'highlight.js/lib/languages/clean';
import markdown from 'highlight.js/lib/languages/markdown';
import javascript from 'highlight.js/lib/languages/javascript';

hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('clean', clean);
hljs.registerLanguage('javascript', javascript);
// eslint-disable-next-line complexity
export const register = async (lang) => {
	switch (lang) {
		case 'onec':
			return hljs.registerLanguage('onec', (await import('highlight.js/lib/languages/1c')).default);
		case 'abnf':
			return hljs.registerLanguage('abnf', (await import('highlight.js/lib/languages/abnf')).default);
		case 'accesslog':
			return hljs.registerLanguage('accesslog', (await import('highlight.js/lib/languages/accesslog')).default);
		case 'actionscript':
			return hljs.registerLanguage('actionscript', (await import('highlight.js/lib/languages/actionscript')).default);
		case 'ada':
			return hljs.registerLanguage('ada', (await import('highlight.js/lib/languages/ada')).default);
		case 'apache':
			return hljs.registerLanguage('apache', (await import('highlight.js/lib/languages/apache')).default);
		case 'applescript':
			return hljs.registerLanguage('applescript', (await import('highlight.js/lib/languages/applescript')).default);
		case 'arduino':
			return hljs.registerLanguage('arduino', (await import('highlight.js/lib/languages/arduino')).default);
		case 'armasm':
			return hljs.registerLanguage('armasm', (await import('highlight.js/lib/languages/armasm')).default);
		case 'asciidoc':
			return hljs.registerLanguage('asciidoc', (await import('highlight.js/lib/languages/asciidoc')).default);
		case 'aspectj':
			return hljs.registerLanguage('aspectj', (await import('highlight.js/lib/languages/aspectj')).default);
		case 'autohotkey':
			return hljs.registerLanguage('autohotkey', (await import('highlight.js/lib/languages/autohotkey')).default);
		case 'autoit':
			return hljs.registerLanguage('autoit', (await import('highlight.js/lib/languages/autoit')).default);
		case 'avrasm':
			return hljs.registerLanguage('avrasm', (await import('highlight.js/lib/languages/avrasm')).default);
		case 'awk':
			return hljs.registerLanguage('awk', (await import('highlight.js/lib/languages/awk')).default);
		case 'axapta':
			return hljs.registerLanguage('axapta', (await import('highlight.js/lib/languages/axapta')).default);
		case 'bash':
			return hljs.registerLanguage('bash', (await import('highlight.js/lib/languages/bash')).default);
		case 'basic':
			return hljs.registerLanguage('basic', (await import('highlight.js/lib/languages/basic')).default);
		case 'bnf':
			return hljs.registerLanguage('bnf', (await import('highlight.js/lib/languages/bnf')).default);
		case 'brainfuck':
			return hljs.registerLanguage('brainfuck', (await import('highlight.js/lib/languages/brainfuck')).default);
		case 'cal':
			return hljs.registerLanguage('cal', (await import('highlight.js/lib/languages/cal')).default);
		case 'capnproto':
			return hljs.registerLanguage('capnproto', (await import('highlight.js/lib/languages/capnproto')).default);
		case 'ceylon':
			return hljs.registerLanguage('ceylon', (await import('highlight.js/lib/languages/ceylon')).default);
		case 'clean':
			return hljs.registerLanguage('clean', (await import('highlight.js/lib/languages/clean')).default);
		case 'clojure':
			return hljs.registerLanguage('clojure', (await import('highlight.js/lib/languages/clojure')).default);
		case 'clojure-repl':
			return hljs.registerLanguage('clojure-repl', (await import('highlight.js/lib/languages/clojure-repl')).default);
		case 'cmake':
			return hljs.registerLanguage('cmake', (await import('highlight.js/lib/languages/cmake')).default);
		case 'coffeescript':
			return hljs.registerLanguage('coffeescript', (await import('highlight.js/lib/languages/coffeescript')).default);
		case 'coq':
			return hljs.registerLanguage('coq', (await import('highlight.js/lib/languages/coq')).default);
		case 'cos':
			return hljs.registerLanguage('cos', (await import('highlight.js/lib/languages/cos')).default);
		case 'cpp':
			return hljs.registerLanguage('cpp', (await import('highlight.js/lib/languages/cpp')).default);
		case 'crmsh':
			return hljs.registerLanguage('crmsh', (await import('highlight.js/lib/languages/crmsh')).default);
		case 'crystal':
			return hljs.registerLanguage('crystal', (await import('highlight.js/lib/languages/crystal')).default);
		case 'cs':
			return hljs.registerLanguage('cs', (await import('highlight.js/lib/languages/cs')).default);
		case 'csp':
			return hljs.registerLanguage('csp', (await import('highlight.js/lib/languages/csp')).default);
		case 'css':
			return hljs.registerLanguage('css', (await import('highlight.js/lib/languages/css')).default);
		case 'd':
			return hljs.registerLanguage('d', (await import('highlight.js/lib/languages/d')).default);
		case 'dart':
			return hljs.registerLanguage('dart', (await import('highlight.js/lib/languages/dart')).default);
		case 'delphi':
			return hljs.registerLanguage('delphi', (await import('highlight.js/lib/languages/delphi')).default);
		case 'diff':
			return hljs.registerLanguage('diff', (await import('highlight.js/lib/languages/diff')).default);
		case 'django':
			return hljs.registerLanguage('django', (await import('highlight.js/lib/languages/django')).default);
		case 'dns':
			return hljs.registerLanguage('dns', (await import('highlight.js/lib/languages/dns')).default);
		case 'dockerfile':
			return hljs.registerLanguage('dockerfile', (await import('highlight.js/lib/languages/dockerfile')).default);
		case 'dos':
			return hljs.registerLanguage('dos', (await import('highlight.js/lib/languages/dos')).default);
		case 'dsconfig':
			return hljs.registerLanguage('dsconfig', (await import('highlight.js/lib/languages/dsconfig')).default);
		case 'dts':
			return hljs.registerLanguage('dts', (await import('highlight.js/lib/languages/dts')).default);
		case 'dust':
			return hljs.registerLanguage('dust', (await import('highlight.js/lib/languages/dust')).default);
		case 'ebnf':
			return hljs.registerLanguage('ebnf', (await import('highlight.js/lib/languages/ebnf')).default);
		case 'elixir':
			return hljs.registerLanguage('elixir', (await import('highlight.js/lib/languages/elixir')).default);
		case 'elm':
			return hljs.registerLanguage('elm', (await import('highlight.js/lib/languages/elm')).default);
		case 'erb':
			return hljs.registerLanguage('erb', (await import('highlight.js/lib/languages/erb')).default);
		case 'erlang':
			return hljs.registerLanguage('erlang', (await import('highlight.js/lib/languages/erlang')).default);
		case 'excel':
			return hljs.registerLanguage('excel', (await import('highlight.js/lib/languages/excel')).default);
		case 'fix':
			return hljs.registerLanguage('fix', (await import('highlight.js/lib/languages/fix')).default);
		case 'flix':
			return hljs.registerLanguage('flix', (await import('highlight.js/lib/languages/flix')).default);
		case 'fortran':
			return hljs.registerLanguage('fortran', (await import('highlight.js/lib/languages/fortran')).default);
		case 'fsharp':
			return hljs.registerLanguage('fsharp', (await import('highlight.js/lib/languages/fsharp')).default);
		case 'gams':
			return hljs.registerLanguage('gams', (await import('highlight.js/lib/languages/gams')).default);
		case 'gauss':
			return hljs.registerLanguage('gauss', (await import('highlight.js/lib/languages/gauss')).default);
		case 'gcode':
			return hljs.registerLanguage('gcode', (await import('highlight.js/lib/languages/gcode')).default);
		case 'gherkin':
			return hljs.registerLanguage('gherkin', (await import('highlight.js/lib/languages/gherkin')).default);
		case 'glsl':
			return hljs.registerLanguage('glsl', (await import('highlight.js/lib/languages/glsl')).default);
		case 'go':
			return hljs.registerLanguage('go', (await import('highlight.js/lib/languages/go')).default);
		case 'golo':
			return hljs.registerLanguage('golo', (await import('highlight.js/lib/languages/golo')).default);
		case 'gradle':
			return hljs.registerLanguage('gradle', (await import('highlight.js/lib/languages/gradle')).default);
		case 'groovy':
			return hljs.registerLanguage('groovy', (await import('highlight.js/lib/languages/groovy')).default);
		case 'haml':
			return hljs.registerLanguage('haml', (await import('highlight.js/lib/languages/haml')).default);
		case 'handlebars':
			return hljs.registerLanguage('handlebars', (await import('highlight.js/lib/languages/handlebars')).default);
		case 'haskell':
			return hljs.registerLanguage('haskell', (await import('highlight.js/lib/languages/haskell')).default);
		case 'haxe':
			return hljs.registerLanguage('haxe', (await import('highlight.js/lib/languages/haxe')).default);
		case 'hsp':
			return hljs.registerLanguage('hsp', (await import('highlight.js/lib/languages/hsp')).default);
		case 'htmlbars':
			return hljs.registerLanguage('htmlbars', (await import('highlight.js/lib/languages/htmlbars')).default);
		case 'http':
			return hljs.registerLanguage('http', (await import('highlight.js/lib/languages/http')).default);
		case 'hy':
			return hljs.registerLanguage('hy', (await import('highlight.js/lib/languages/hy')).default);
		case 'inform7':
			return hljs.registerLanguage('inform7', (await import('highlight.js/lib/languages/inform7')).default);
		case 'ini':
			return hljs.registerLanguage('ini', (await import('highlight.js/lib/languages/ini')).default);
		case 'irpf90':
			return hljs.registerLanguage('irpf90', (await import('highlight.js/lib/languages/irpf90')).default);
		case 'java':
			return hljs.registerLanguage('java', (await import('highlight.js/lib/languages/java')).default);
		case 'javascript':
			return hljs.registerLanguage('javascript', (await import('highlight.js/lib/languages/javascript')).default);
		case 'jboss-cli':
			return hljs.registerLanguage('jboss-cli', (await import('highlight.js/lib/languages/jboss-cli')).default);
		case 'json':
			return hljs.registerLanguage('json', (await import('highlight.js/lib/languages/json')).default);
		case 'julia':
			return hljs.registerLanguage('julia', (await import('highlight.js/lib/languages/julia')).default);
		case 'julia-repl':
			return hljs.registerLanguage('julia-repl', (await import('highlight.js/lib/languages/julia-repl')).default);
		case 'kotlin':
			return hljs.registerLanguage('kotlin', (await import('highlight.js/lib/languages/kotlin')).default);
		case 'lasso':
			return hljs.registerLanguage('lasso', (await import('highlight.js/lib/languages/lasso')).default);
		case 'ldif':
			return hljs.registerLanguage('ldif', (await import('highlight.js/lib/languages/ldif')).default);
		case 'leaf':
			return hljs.registerLanguage('leaf', (await import('highlight.js/lib/languages/leaf')).default);
		case 'less':
			return hljs.registerLanguage('less', (await import('highlight.js/lib/languages/less')).default);
		case 'lisp':
			return hljs.registerLanguage('lisp', (await import('highlight.js/lib/languages/lisp')).default);
		case 'livecodeserver':
			return hljs.registerLanguage('livecodeserver', (await import('highlight.js/lib/languages/livecodeserver')).default);
		case 'livescript':
			return hljs.registerLanguage('livescript', (await import('highlight.js/lib/languages/livescript')).default);
		case 'llvm':
			return hljs.registerLanguage('llvm', (await import('highlight.js/lib/languages/llvm')).default);
		case 'lsl':
			return hljs.registerLanguage('lsl', (await import('highlight.js/lib/languages/lsl')).default);
		case 'lua':
			return hljs.registerLanguage('lua', (await import('highlight.js/lib/languages/lua')).default);
		case 'makefile':
			return hljs.registerLanguage('makefile', (await import('highlight.js/lib/languages/makefile')).default);
		case 'markdown':
			return hljs.registerLanguage('markdown', (await import('highlight.js/lib/languages/markdown')).default);
		case 'mathematica':
			return hljs.registerLanguage('mathematica', (await import('highlight.js/lib/languages/mathematica')).default);
		case 'matlab':
			return hljs.registerLanguage('matlab', (await import('highlight.js/lib/languages/matlab')).default);
		case 'maxima':
			return hljs.registerLanguage('maxima', (await import('highlight.js/lib/languages/maxima')).default);
		case 'mel':
			return hljs.registerLanguage('mel', (await import('highlight.js/lib/languages/mel')).default);
		case 'mercury':
			return hljs.registerLanguage('mercury', (await import('highlight.js/lib/languages/mercury')).default);
		case 'mipsasm':
			return hljs.registerLanguage('mipsasm', (await import('highlight.js/lib/languages/mipsasm')).default);
		case 'mizar':
			return hljs.registerLanguage('mizar', (await import('highlight.js/lib/languages/mizar')).default);
		case 'perl':
			return hljs.registerLanguage('perl', (await import('highlight.js/lib/languages/perl')).default);
		case 'mojolicious':
			return hljs.registerLanguage('mojolicious', (await import('highlight.js/lib/languages/mojolicious')).default);
		case 'monkey':
			return hljs.registerLanguage('monkey', (await import('highlight.js/lib/languages/monkey')).default);
		case 'moonscript':
			return hljs.registerLanguage('moonscript', (await import('highlight.js/lib/languages/moonscript')).default);
		case 'n1ql':
			return hljs.registerLanguage('n1ql', (await import('highlight.js/lib/languages/n1ql')).default);
		case 'nginx':
			return hljs.registerLanguage('nginx', (await import('highlight.js/lib/languages/nginx')).default);
		case 'nimrod':
			return hljs.registerLanguage('nimrod', (await import('highlight.js/lib/languages/nimrod')).default);
		case 'nix':
			return hljs.registerLanguage('nix', (await import('highlight.js/lib/languages/nix')).default);
		case 'nsis':
			return hljs.registerLanguage('nsis', (await import('highlight.js/lib/languages/nsis')).default);
		case 'objectivec':
			return hljs.registerLanguage('objectivec', (await import('highlight.js/lib/languages/objectivec')).default);
		case 'ocaml':
			return hljs.registerLanguage('ocaml', (await import('highlight.js/lib/languages/ocaml')).default);
		case 'openscad':
			return hljs.registerLanguage('openscad', (await import('highlight.js/lib/languages/openscad')).default);
		case 'oxygene':
			return hljs.registerLanguage('oxygene', (await import('highlight.js/lib/languages/oxygene')).default);
		case 'parser3':
			return hljs.registerLanguage('parser3', (await import('highlight.js/lib/languages/parser3')).default);
		case 'pf':
			return hljs.registerLanguage('pf', (await import('highlight.js/lib/languages/pf')).default);
		case 'php':
			return hljs.registerLanguage('php', (await import('highlight.js/lib/languages/php')).default);
		case 'pony':
			return hljs.registerLanguage('pony', (await import('highlight.js/lib/languages/pony')).default);
		case 'powershell':
			return hljs.registerLanguage('powershell', (await import('highlight.js/lib/languages/powershell')).default);
		case 'processing':
			return hljs.registerLanguage('processing', (await import('highlight.js/lib/languages/processing')).default);
		case 'profile':
			return hljs.registerLanguage('profile', (await import('highlight.js/lib/languages/profile')).default);
		case 'prolog':
			return hljs.registerLanguage('prolog', (await import('highlight.js/lib/languages/prolog')).default);
		case 'protobuf':
			return hljs.registerLanguage('protobuf', (await import('highlight.js/lib/languages/protobuf')).default);
		case 'puppet':
			return hljs.registerLanguage('puppet', (await import('highlight.js/lib/languages/puppet')).default);
		case 'purebasic':
			return hljs.registerLanguage('purebasic', (await import('highlight.js/lib/languages/purebasic')).default);
		case 'python':
			return hljs.registerLanguage('python', (await import('highlight.js/lib/languages/python')).default);
		case 'q':
			return hljs.registerLanguage('q', (await import('highlight.js/lib/languages/q')).default);
		case 'qml':
			return hljs.registerLanguage('qml', (await import('highlight.js/lib/languages/qml')).default);
		case 'r':
			return hljs.registerLanguage('r', (await import('highlight.js/lib/languages/r')).default);
		case 'rib':
			return hljs.registerLanguage('rib', (await import('highlight.js/lib/languages/rib')).default);
		case 'roboconf':
			return hljs.registerLanguage('roboconf', (await import('highlight.js/lib/languages/roboconf')).default);
		case 'rsl':
			return hljs.registerLanguage('rsl', (await import('highlight.js/lib/languages/rsl')).default);
		case 'ruleslanguage':
			return hljs.registerLanguage('ruleslanguage', (await import('highlight.js/lib/languages/ruleslanguage')).default);
		case 'rust':
			return hljs.registerLanguage('rust', (await import('highlight.js/lib/languages/rust')).default);
		case 'scala':
			return hljs.registerLanguage('scala', (await import('highlight.js/lib/languages/scala')).default);
		case 'scheme':
			return hljs.registerLanguage('scheme', (await import('highlight.js/lib/languages/scheme')).default);
		case 'scilab':
			return hljs.registerLanguage('scilab', (await import('highlight.js/lib/languages/scilab')).default);
		case 'scss':
			return hljs.registerLanguage('scss', (await import('highlight.js/lib/languages/scss')).default);
		case 'shell':
			return hljs.registerLanguage('shell', (await import('highlight.js/lib/languages/shell')).default);
		case 'smali':
			return hljs.registerLanguage('smali', (await import('highlight.js/lib/languages/smali')).default);
		case 'smalltalk':
			return hljs.registerLanguage('smalltalk', (await import('highlight.js/lib/languages/smalltalk')).default);
		case 'sml':
			return hljs.registerLanguage('sml', (await import('highlight.js/lib/languages/sml')).default);
		case 'sqf':
			return hljs.registerLanguage('sqf', (await import('highlight.js/lib/languages/sqf')).default);
		case 'sql':
			return hljs.registerLanguage('sql', (await import('highlight.js/lib/languages/sql')).default);
		case 'stan':
			return hljs.registerLanguage('stan', (await import('highlight.js/lib/languages/stan')).default);
		case 'stata':
			return hljs.registerLanguage('stata', (await import('highlight.js/lib/languages/stata')).default);
		case 'step21':
			return hljs.registerLanguage('step21', (await import('highlight.js/lib/languages/step21')).default);
		case 'stylus':
			return hljs.registerLanguage('stylus', (await import('highlight.js/lib/languages/stylus')).default);
		case 'subunit':
			return hljs.registerLanguage('subunit', (await import('highlight.js/lib/languages/subunit')).default);
		case 'swift':
			return hljs.registerLanguage('swift', (await import('highlight.js/lib/languages/swift')).default);
		case 'taggerscript':
			return hljs.registerLanguage('taggerscript', (await import('highlight.js/lib/languages/taggerscript')).default);
		case 'yaml':
			return hljs.registerLanguage('yaml', (await import('highlight.js/lib/languages/yaml')).default);
		case 'tap':
			return hljs.registerLanguage('tap', (await import('highlight.js/lib/languages/tap')).default);
		case 'tcl':
			return hljs.registerLanguage('tcl', (await import('highlight.js/lib/languages/tcl')).default);
		case 'tex':
			return hljs.registerLanguage('tex', (await import('highlight.js/lib/languages/tex')).default);
		case 'thrift':
			return hljs.registerLanguage('thrift', (await import('highlight.js/lib/languages/thrift')).default);
		case 'tp':
			return hljs.registerLanguage('tp', (await import('highlight.js/lib/languages/tp')).default);
		case 'twig':
			return hljs.registerLanguage('twig', (await import('highlight.js/lib/languages/twig')).default);
		case 'typescript':
			return hljs.registerLanguage('typescript', (await import('highlight.js/lib/languages/typescript')).default);
		case 'vala':
			return hljs.registerLanguage('vala', (await import('highlight.js/lib/languages/vala')).default);
		case 'vbnet':
			return hljs.registerLanguage('vbnet', (await import('highlight.js/lib/languages/vbnet')).default);
		case 'vbscript':
			return hljs.registerLanguage('vbscript', (await import('highlight.js/lib/languages/vbscript')).default);
		case 'vbscript-html':
			return hljs.registerLanguage('vbscript-html(', (await import('highlight.js/lib/languages/vbscript-html')).default);
		case 'verilog':
			return hljs.registerLanguage('verilog', (await import('highlight.js/lib/languages/verilog')).default);
		case 'vhdl':
			return hljs.registerLanguage('vhdl', (await import('highlight.js/lib/languages/vhdl')).default);
		case 'vim':
			return hljs.registerLanguage('vim', (await import('highlight.js/lib/languages/vim')).default);
		case 'x86asm':
			return hljs.registerLanguage('x86asm', (await import('highlight.js/lib/languages/x86asm')).default);
		case 'xl':
			return hljs.registerLanguage('xl', (await import('highlight.js/lib/languages/xl')).default);
		case 'xquery':
			return hljs.registerLanguage('xquery', (await import('highlight.js/lib/languages/xquery')).default);
		case 'zephir':
			return hljs.registerLanguage('zephir', (await import('highlight.js/lib/languages/zephir')).default);
		default:
			return hljs.registerLanguage('plaintext', (await import('highlight.js/lib/languages/plaintext')).default);
	}
};

export default hljs;
