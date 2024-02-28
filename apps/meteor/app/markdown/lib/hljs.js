import hljs from 'hljs9/lib/highlight';
import clean from 'hljs9/lib/languages/clean';
import javascript from 'hljs9/lib/languages/javascript';
import markdown from 'hljs9/lib/languages/markdown';

hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('clean', clean);
hljs.registerLanguage('javascript', javascript);

export const register = async (lang) => {
	switch (lang) {
		case 'onec':
			return hljs.registerLanguage('onec', (await import('hljs9/lib/languages/1c')).default);
		case 'abnf':
			return hljs.registerLanguage('abnf', (await import('hljs9/lib/languages/abnf')).default);
		case 'accesslog':
			return hljs.registerLanguage('accesslog', (await import('hljs9/lib/languages/accesslog')).default);
		case 'actionscript':
			return hljs.registerLanguage('actionscript', (await import('hljs9/lib/languages/actionscript')).default);
		case 'ada':
			return hljs.registerLanguage('ada', (await import('hljs9/lib/languages/ada')).default);
		case 'apache':
			return hljs.registerLanguage('apache', (await import('hljs9/lib/languages/apache')).default);
		case 'applescript':
			return hljs.registerLanguage('applescript', (await import('hljs9/lib/languages/applescript')).default);
		case 'arduino':
			return hljs.registerLanguage('arduino', (await import('hljs9/lib/languages/arduino')).default);
		case 'armasm':
			return hljs.registerLanguage('armasm', (await import('hljs9/lib/languages/armasm')).default);
		case 'asciidoc':
			return hljs.registerLanguage('asciidoc', (await import('hljs9/lib/languages/asciidoc')).default);
		case 'aspectj':
			return hljs.registerLanguage('aspectj', (await import('hljs9/lib/languages/aspectj')).default);
		case 'autohotkey':
			return hljs.registerLanguage('autohotkey', (await import('hljs9/lib/languages/autohotkey')).default);
		case 'autoit':
			return hljs.registerLanguage('autoit', (await import('hljs9/lib/languages/autoit')).default);
		case 'avrasm':
			return hljs.registerLanguage('avrasm', (await import('hljs9/lib/languages/avrasm')).default);
		case 'awk':
			return hljs.registerLanguage('awk', (await import('hljs9/lib/languages/awk')).default);
		case 'axapta':
			return hljs.registerLanguage('axapta', (await import('hljs9/lib/languages/axapta')).default);
		case 'bash':
			return hljs.registerLanguage('bash', (await import('hljs9/lib/languages/bash')).default);
		case 'basic':
			return hljs.registerLanguage('basic', (await import('hljs9/lib/languages/basic')).default);
		case 'bnf':
			return hljs.registerLanguage('bnf', (await import('hljs9/lib/languages/bnf')).default);
		case 'brainfuck':
			return hljs.registerLanguage('brainfuck', (await import('hljs9/lib/languages/brainfuck')).default);
		case 'cal':
			return hljs.registerLanguage('cal', (await import('hljs9/lib/languages/cal')).default);
		case 'capnproto':
			return hljs.registerLanguage('capnproto', (await import('hljs9/lib/languages/capnproto')).default);
		case 'ceylon':
			return hljs.registerLanguage('ceylon', (await import('hljs9/lib/languages/ceylon')).default);
		case 'clean':
			return hljs.registerLanguage('clean', (await import('hljs9/lib/languages/clean')).default);
		case 'clojure':
			return hljs.registerLanguage('clojure', (await import('hljs9/lib/languages/clojure')).default);
		case 'clojure-repl':
			return hljs.registerLanguage('clojure-repl', (await import('hljs9/lib/languages/clojure-repl')).default);
		case 'cmake':
			return hljs.registerLanguage('cmake', (await import('hljs9/lib/languages/cmake')).default);
		case 'coffeescript':
			return hljs.registerLanguage('coffeescript', (await import('hljs9/lib/languages/coffeescript')).default);
		case 'coq':
			return hljs.registerLanguage('coq', (await import('hljs9/lib/languages/coq')).default);
		case 'cos':
			return hljs.registerLanguage('cos', (await import('hljs9/lib/languages/cos')).default);
		case 'cpp':
			return hljs.registerLanguage('cpp', (await import('hljs9/lib/languages/cpp')).default);
		case 'crmsh':
			return hljs.registerLanguage('crmsh', (await import('hljs9/lib/languages/crmsh')).default);
		case 'crystal':
			return hljs.registerLanguage('crystal', (await import('hljs9/lib/languages/crystal')).default);
		case 'cs':
			return hljs.registerLanguage('cs', (await import('hljs9/lib/languages/cs')).default);
		case 'csp':
			return hljs.registerLanguage('csp', (await import('hljs9/lib/languages/csp')).default);
		case 'css':
			return hljs.registerLanguage('css', (await import('hljs9/lib/languages/css')).default);
		case 'd':
			return hljs.registerLanguage('d', (await import('hljs9/lib/languages/d')).default);
		case 'dart':
			return hljs.registerLanguage('dart', (await import('hljs9/lib/languages/dart')).default);
		case 'delphi':
			return hljs.registerLanguage('delphi', (await import('hljs9/lib/languages/delphi')).default);
		case 'diff':
			return hljs.registerLanguage('diff', (await import('hljs9/lib/languages/diff')).default);
		case 'django':
			return hljs.registerLanguage('django', (await import('hljs9/lib/languages/django')).default);
		case 'dns':
			return hljs.registerLanguage('dns', (await import('hljs9/lib/languages/dns')).default);
		case 'dockerfile':
			return hljs.registerLanguage('dockerfile', (await import('hljs9/lib/languages/dockerfile')).default);
		case 'dos':
			return hljs.registerLanguage('dos', (await import('hljs9/lib/languages/dos')).default);
		case 'dsconfig':
			return hljs.registerLanguage('dsconfig', (await import('hljs9/lib/languages/dsconfig')).default);
		case 'dts':
			return hljs.registerLanguage('dts', (await import('hljs9/lib/languages/dts')).default);
		case 'dust':
			return hljs.registerLanguage('dust', (await import('hljs9/lib/languages/dust')).default);
		case 'ebnf':
			return hljs.registerLanguage('ebnf', (await import('hljs9/lib/languages/ebnf')).default);
		case 'elixir':
			return hljs.registerLanguage('elixir', (await import('hljs9/lib/languages/elixir')).default);
		case 'elm':
			return hljs.registerLanguage('elm', (await import('hljs9/lib/languages/elm')).default);
		case 'erb':
			return hljs.registerLanguage('erb', (await import('hljs9/lib/languages/erb')).default);
		case 'erlang':
			return hljs.registerLanguage('erlang', (await import('hljs9/lib/languages/erlang')).default);
		case 'excel':
			return hljs.registerLanguage('excel', (await import('hljs9/lib/languages/excel')).default);
		case 'fix':
			return hljs.registerLanguage('fix', (await import('hljs9/lib/languages/fix')).default);
		case 'flix':
			return hljs.registerLanguage('flix', (await import('hljs9/lib/languages/flix')).default);
		case 'fortran':
			return hljs.registerLanguage('fortran', (await import('hljs9/lib/languages/fortran')).default);
		case 'fsharp':
			return hljs.registerLanguage('fsharp', (await import('hljs9/lib/languages/fsharp')).default);
		case 'gams':
			return hljs.registerLanguage('gams', (await import('hljs9/lib/languages/gams')).default);
		case 'gauss':
			return hljs.registerLanguage('gauss', (await import('hljs9/lib/languages/gauss')).default);
		case 'gcode':
			return hljs.registerLanguage('gcode', (await import('hljs9/lib/languages/gcode')).default);
		case 'gherkin':
			return hljs.registerLanguage('gherkin', (await import('hljs9/lib/languages/gherkin')).default);
		case 'glsl':
			return hljs.registerLanguage('glsl', (await import('hljs9/lib/languages/glsl')).default);
		case 'go':
			return hljs.registerLanguage('go', (await import('hljs9/lib/languages/go')).default);
		case 'golo':
			return hljs.registerLanguage('golo', (await import('hljs9/lib/languages/golo')).default);
		case 'gradle':
			return hljs.registerLanguage('gradle', (await import('hljs9/lib/languages/gradle')).default);
		case 'groovy':
			return hljs.registerLanguage('groovy', (await import('hljs9/lib/languages/groovy')).default);
		case 'haml':
			return hljs.registerLanguage('haml', (await import('hljs9/lib/languages/haml')).default);
		case 'handlebars':
			return hljs.registerLanguage('handlebars', (await import('hljs9/lib/languages/handlebars')).default);
		case 'haskell':
			return hljs.registerLanguage('haskell', (await import('hljs9/lib/languages/haskell')).default);
		case 'haxe':
			return hljs.registerLanguage('haxe', (await import('hljs9/lib/languages/haxe')).default);
		case 'hsp':
			return hljs.registerLanguage('hsp', (await import('hljs9/lib/languages/hsp')).default);
		case 'htmlbars':
			return hljs.registerLanguage('htmlbars', (await import('hljs9/lib/languages/htmlbars')).default);
		case 'http':
			return hljs.registerLanguage('http', (await import('hljs9/lib/languages/http')).default);
		case 'hy':
			return hljs.registerLanguage('hy', (await import('hljs9/lib/languages/hy')).default);
		case 'inform7':
			return hljs.registerLanguage('inform7', (await import('hljs9/lib/languages/inform7')).default);
		case 'ini':
			return hljs.registerLanguage('ini', (await import('hljs9/lib/languages/ini')).default);
		case 'irpf90':
			return hljs.registerLanguage('irpf90', (await import('hljs9/lib/languages/irpf90')).default);
		case 'java':
			return hljs.registerLanguage('java', (await import('hljs9/lib/languages/java')).default);
		case 'javascript':
			return hljs.registerLanguage('javascript', (await import('hljs9/lib/languages/javascript')).default);
		case 'jboss-cli':
			return hljs.registerLanguage('jboss-cli', (await import('hljs9/lib/languages/jboss-cli')).default);
		case 'json':
			return hljs.registerLanguage('json', (await import('hljs9/lib/languages/json')).default);
		case 'julia':
			return hljs.registerLanguage('julia', (await import('hljs9/lib/languages/julia')).default);
		case 'julia-repl':
			return hljs.registerLanguage('julia-repl', (await import('hljs9/lib/languages/julia-repl')).default);
		case 'kotlin':
			return hljs.registerLanguage('kotlin', (await import('hljs9/lib/languages/kotlin')).default);
		case 'lasso':
			return hljs.registerLanguage('lasso', (await import('hljs9/lib/languages/lasso')).default);
		case 'ldif':
			return hljs.registerLanguage('ldif', (await import('hljs9/lib/languages/ldif')).default);
		case 'leaf':
			return hljs.registerLanguage('leaf', (await import('hljs9/lib/languages/leaf')).default);
		case 'less':
			return hljs.registerLanguage('less', (await import('hljs9/lib/languages/less')).default);
		case 'lisp':
			return hljs.registerLanguage('lisp', (await import('hljs9/lib/languages/lisp')).default);
		case 'livecodeserver':
			return hljs.registerLanguage('livecodeserver', (await import('hljs9/lib/languages/livecodeserver')).default);
		case 'livescript':
			return hljs.registerLanguage('livescript', (await import('hljs9/lib/languages/livescript')).default);
		case 'llvm':
			return hljs.registerLanguage('llvm', (await import('hljs9/lib/languages/llvm')).default);
		case 'lsl':
			return hljs.registerLanguage('lsl', (await import('hljs9/lib/languages/lsl')).default);
		case 'lua':
			return hljs.registerLanguage('lua', (await import('hljs9/lib/languages/lua')).default);
		case 'makefile':
			return hljs.registerLanguage('makefile', (await import('hljs9/lib/languages/makefile')).default);
		case 'markdown':
			return hljs.registerLanguage('markdown', (await import('hljs9/lib/languages/markdown')).default);
		case 'mathematica':
			return hljs.registerLanguage('mathematica', (await import('hljs9/lib/languages/mathematica')).default);
		case 'matlab':
			return hljs.registerLanguage('matlab', (await import('hljs9/lib/languages/matlab')).default);
		case 'maxima':
			return hljs.registerLanguage('maxima', (await import('hljs9/lib/languages/maxima')).default);
		case 'mel':
			return hljs.registerLanguage('mel', (await import('hljs9/lib/languages/mel')).default);
		case 'mercury':
			return hljs.registerLanguage('mercury', (await import('hljs9/lib/languages/mercury')).default);
		case 'mipsasm':
			return hljs.registerLanguage('mipsasm', (await import('hljs9/lib/languages/mipsasm')).default);
		case 'mizar':
			return hljs.registerLanguage('mizar', (await import('hljs9/lib/languages/mizar')).default);
		case 'perl':
			return hljs.registerLanguage('perl', (await import('hljs9/lib/languages/perl')).default);
		case 'mojolicious':
			return hljs.registerLanguage('mojolicious', (await import('hljs9/lib/languages/mojolicious')).default);
		case 'monkey':
			return hljs.registerLanguage('monkey', (await import('hljs9/lib/languages/monkey')).default);
		case 'moonscript':
			return hljs.registerLanguage('moonscript', (await import('hljs9/lib/languages/moonscript')).default);
		case 'n1ql':
			return hljs.registerLanguage('n1ql', (await import('hljs9/lib/languages/n1ql')).default);
		case 'nginx':
			return hljs.registerLanguage('nginx', (await import('hljs9/lib/languages/nginx')).default);
		case 'nimrod':
			return hljs.registerLanguage('nimrod', (await import('hljs9/lib/languages/nimrod')).default);
		case 'nix':
			return hljs.registerLanguage('nix', (await import('hljs9/lib/languages/nix')).default);
		case 'nsis':
			return hljs.registerLanguage('nsis', (await import('hljs9/lib/languages/nsis')).default);
		case 'objectivec':
			return hljs.registerLanguage('objectivec', (await import('hljs9/lib/languages/objectivec')).default);
		case 'ocaml':
			return hljs.registerLanguage('ocaml', (await import('hljs9/lib/languages/ocaml')).default);
		case 'openscad':
			return hljs.registerLanguage('openscad', (await import('hljs9/lib/languages/openscad')).default);
		case 'oxygene':
			return hljs.registerLanguage('oxygene', (await import('hljs9/lib/languages/oxygene')).default);
		case 'parser3':
			return hljs.registerLanguage('parser3', (await import('hljs9/lib/languages/parser3')).default);
		case 'pf':
			return hljs.registerLanguage('pf', (await import('hljs9/lib/languages/pf')).default);
		case 'php':
			return hljs.registerLanguage('php', (await import('hljs9/lib/languages/php')).default);
		case 'pony':
			return hljs.registerLanguage('pony', (await import('hljs9/lib/languages/pony')).default);
		case 'powershell':
			return hljs.registerLanguage('powershell', (await import('hljs9/lib/languages/powershell')).default);
		case 'processing':
			return hljs.registerLanguage('processing', (await import('hljs9/lib/languages/processing')).default);
		case 'profile':
			return hljs.registerLanguage('profile', (await import('hljs9/lib/languages/profile')).default);
		case 'prolog':
			return hljs.registerLanguage('prolog', (await import('hljs9/lib/languages/prolog')).default);
		case 'protobuf':
			return hljs.registerLanguage('protobuf', (await import('hljs9/lib/languages/protobuf')).default);
		case 'puppet':
			return hljs.registerLanguage('puppet', (await import('hljs9/lib/languages/puppet')).default);
		case 'purebasic':
			return hljs.registerLanguage('purebasic', (await import('hljs9/lib/languages/purebasic')).default);
		case 'python':
			return hljs.registerLanguage('python', (await import('hljs9/lib/languages/python')).default);
		case 'q':
			return hljs.registerLanguage('q', (await import('hljs9/lib/languages/q')).default);
		case 'qml':
			return hljs.registerLanguage('qml', (await import('hljs9/lib/languages/qml')).default);
		case 'r':
			return hljs.registerLanguage('r', (await import('hljs9/lib/languages/r')).default);
		case 'rib':
			return hljs.registerLanguage('rib', (await import('hljs9/lib/languages/rib')).default);
		case 'roboconf':
			return hljs.registerLanguage('roboconf', (await import('hljs9/lib/languages/roboconf')).default);
		case 'rsl':
			return hljs.registerLanguage('rsl', (await import('hljs9/lib/languages/rsl')).default);
		case 'ruleslanguage':
			return hljs.registerLanguage('ruleslanguage', (await import('hljs9/lib/languages/ruleslanguage')).default);
		case 'rust':
			return hljs.registerLanguage('rust', (await import('hljs9/lib/languages/rust')).default);
		case 'scala':
			return hljs.registerLanguage('scala', (await import('hljs9/lib/languages/scala')).default);
		case 'scheme':
			return hljs.registerLanguage('scheme', (await import('hljs9/lib/languages/scheme')).default);
		case 'scilab':
			return hljs.registerLanguage('scilab', (await import('hljs9/lib/languages/scilab')).default);
		case 'scss':
			return hljs.registerLanguage('scss', (await import('hljs9/lib/languages/scss')).default);
		case 'shell':
			return hljs.registerLanguage('shell', (await import('hljs9/lib/languages/shell')).default);
		case 'smali':
			return hljs.registerLanguage('smali', (await import('hljs9/lib/languages/smali')).default);
		case 'smalltalk':
			return hljs.registerLanguage('smalltalk', (await import('hljs9/lib/languages/smalltalk')).default);
		case 'sml':
			return hljs.registerLanguage('sml', (await import('hljs9/lib/languages/sml')).default);
		case 'sqf':
			return hljs.registerLanguage('sqf', (await import('hljs9/lib/languages/sqf')).default);
		case 'sql':
			return hljs.registerLanguage('sql', (await import('hljs9/lib/languages/sql')).default);
		case 'stan':
			return hljs.registerLanguage('stan', (await import('hljs9/lib/languages/stan')).default);
		case 'stata':
			return hljs.registerLanguage('stata', (await import('hljs9/lib/languages/stata')).default);
		case 'step21':
			return hljs.registerLanguage('step21', (await import('hljs9/lib/languages/step21')).default);
		case 'stylus':
			return hljs.registerLanguage('stylus', (await import('hljs9/lib/languages/stylus')).default);
		case 'subunit':
			return hljs.registerLanguage('subunit', (await import('hljs9/lib/languages/subunit')).default);
		case 'swift':
			return hljs.registerLanguage('swift', (await import('hljs9/lib/languages/swift')).default);
		case 'taggerscript':
			return hljs.registerLanguage('taggerscript', (await import('hljs9/lib/languages/taggerscript')).default);
		case 'yaml':
			return hljs.registerLanguage('yaml', (await import('hljs9/lib/languages/yaml')).default);
		case 'tap':
			return hljs.registerLanguage('tap', (await import('hljs9/lib/languages/tap')).default);
		case 'tcl':
			return hljs.registerLanguage('tcl', (await import('hljs9/lib/languages/tcl')).default);
		case 'tex':
			return hljs.registerLanguage('tex', (await import('hljs9/lib/languages/tex')).default);
		case 'thrift':
			return hljs.registerLanguage('thrift', (await import('hljs9/lib/languages/thrift')).default);
		case 'tp':
			return hljs.registerLanguage('tp', (await import('hljs9/lib/languages/tp')).default);
		case 'twig':
			return hljs.registerLanguage('twig', (await import('hljs9/lib/languages/twig')).default);
		case 'typescript':
			return hljs.registerLanguage('typescript', (await import('hljs9/lib/languages/typescript')).default);
		case 'vala':
			return hljs.registerLanguage('vala', (await import('hljs9/lib/languages/vala')).default);
		case 'vbnet':
			return hljs.registerLanguage('vbnet', (await import('hljs9/lib/languages/vbnet')).default);
		case 'vbscript':
			return hljs.registerLanguage('vbscript', (await import('hljs9/lib/languages/vbscript')).default);
		case 'vbscript-html':
			return hljs.registerLanguage('vbscript-html(', (await import('hljs9/lib/languages/vbscript-html')).default);
		case 'verilog':
			return hljs.registerLanguage('verilog', (await import('hljs9/lib/languages/verilog')).default);
		case 'vhdl':
			return hljs.registerLanguage('vhdl', (await import('hljs9/lib/languages/vhdl')).default);
		case 'vim':
			return hljs.registerLanguage('vim', (await import('hljs9/lib/languages/vim')).default);
		case 'x86asm':
			return hljs.registerLanguage('x86asm', (await import('hljs9/lib/languages/x86asm')).default);
		case 'xl':
			return hljs.registerLanguage('xl', (await import('hljs9/lib/languages/xl')).default);
		case 'xquery':
			return hljs.registerLanguage('xquery', (await import('hljs9/lib/languages/xquery')).default);
		case 'zephir':
			return hljs.registerLanguage('zephir', (await import('hljs9/lib/languages/zephir')).default);
		default:
			return hljs.registerLanguage('plaintext', (await import('hljs9/lib/languages/plaintext')).default);
	}
};

export default hljs;
