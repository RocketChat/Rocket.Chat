import 'codemirror/addon/fold/brace-fold.js';
import 'codemirror/addon/fold/comment-fold.js';
import 'codemirror/addon/fold/foldcode.js';
import 'codemirror/addon/fold/foldgutter.css';
import 'codemirror/addon/fold/foldgutter.js';
import 'codemirror/addon/fold/indent-fold.js';
import 'codemirror/addon/fold/markdown-fold.js';
import 'codemirror/addon/fold/xml-fold.js';

// lints
// import 'codemirror/addon/lint/jsonlint.js';
// import 'codemirror/addon/lint/jshint.js';
// import 'codemirror/addon/lint/csslint.js';
// import 'codemirror/addon/lint/css-lint.js';
// import 'codemirror/addon/lint/html-lint.js';
// import 'codemirror/addon/lint/javascript-lint.js';
// import 'codemirror/addon/lint/json-lint.js';
// import 'codemirror/addon/lint/yaml-lint.js';
// import 'codemirror/addon/lint/lint.css';
// import 'codemirror/addon/lint/lint.js';

// active line mode
import 'codemirror/addon/selection/active-line.js';

// search/replace
import 'codemirror/addon/search/search.js';
import 'codemirror/addon/search/searchcursor.js';
import 'codemirror/addon/dialog/dialog.js';
import 'codemirror/addon/dialog/dialog.css';

// overlay: required by `gfm.js`
import 'codemirror/addon/mode/overlay.js';

// markdown list continuation; nice complement for gfm
import 'codemirror/addon/edit/continuelist.js';

// modes
import 'codemirror/mode/apl/apl.js';
import 'codemirror/mode/asterisk/asterisk.js';
import 'codemirror/mode/clike/clike.js';
import 'codemirror/mode/clojure/clojure.js';
import 'codemirror/mode/cobol/cobol.js';
import 'codemirror/mode/commonlisp/commonlisp.js';
import 'codemirror/mode/coffeescript/coffeescript.js';
import 'codemirror/mode/css/css.js';
import 'codemirror/mode/cypher/cypher.js';
import 'codemirror/mode/d/d.js';
import 'codemirror/mode/diff/diff.js';
import 'codemirror/mode/django/django.js';
import 'codemirror/mode/dockerfile/dockerfile.js';
import 'codemirror/mode/dtd/dtd.js';
import 'codemirror/mode/dylan/dylan.js';
import 'codemirror/mode/ecl/ecl.js';
import 'codemirror/mode/eiffel/eiffel.js';
import 'codemirror/mode/erlang/erlang.js';
import 'codemirror/mode/fortran/fortran.js';
import 'codemirror/mode/gas/gas.js';
import 'codemirror/mode/gfm/gfm.js';
import 'codemirror/mode/gherkin/gherkin.js';
import 'codemirror/mode/go/go.js';
import 'codemirror/mode/groovy/groovy.js';
import 'codemirror/mode/haml/haml.js';
import 'codemirror/mode/haskell/haskell.js';
import 'codemirror/mode/haxe/haxe.js';
import 'codemirror/mode/htmlembedded/htmlembedded.js';
import 'codemirror/mode/htmlmixed/htmlmixed.js';
import 'codemirror/mode/http/http.js';
import 'codemirror/mode/idl/idl.js';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/jinja2/jinja2.js';
import 'codemirror/mode/julia/julia.js';
import 'codemirror/mode/livescript/livescript.js';
import 'codemirror/mode/lua/lua.js';
import 'codemirror/mode/markdown/markdown.js';
import 'codemirror/mode/mirc/mirc.js';
import 'codemirror/mode/mllike/mllike.js';
import 'codemirror/mode/modelica/modelica.js';
import 'codemirror/mode/nginx/nginx.js';
import 'codemirror/mode/ntriples/ntriples.js';
import 'codemirror/mode/octave/octave.js';
import 'codemirror/mode/pascal/pascal.js';
import 'codemirror/mode/pegjs/pegjs.js';
import 'codemirror/mode/perl/perl.js';
import 'codemirror/mode/php/php.js';
import 'codemirror/mode/pig/pig.js';
import 'codemirror/mode/properties/properties.js';
import 'codemirror/mode/puppet/puppet.js';
import 'codemirror/mode/python/python.js';
import 'codemirror/mode/q/q.js';
import 'codemirror/mode/r/r.js';
import 'codemirror/mode/rpm/rpm.js';
import 'codemirror/mode/rst/rst.js';
import 'codemirror/mode/ruby/ruby.js';
import 'codemirror/mode/rust/rust.js';
import 'codemirror/mode/sass/sass.js';
import 'codemirror/mode/scheme/scheme.js';
import 'codemirror/mode/shell/shell.js';
import 'codemirror/mode/sieve/sieve.js';
import 'codemirror/mode/slim/slim.js';
import 'codemirror/mode/smalltalk/smalltalk.js';
import 'codemirror/mode/smarty/smarty.js';
import 'codemirror/mode/solr/solr.js';
import 'codemirror/mode/sparql/sparql.js';
import 'codemirror/mode/sql/sql.js';
import 'codemirror/mode/stex/stex.js';
import 'codemirror/mode/tcl/tcl.js';
import 'codemirror/mode/textile/textile.js';
import 'codemirror/mode/tiddlywiki/tiddlywiki.js';
import 'codemirror/mode/tiki/tiki.js';
import 'codemirror/mode/toml/toml.js';
import 'codemirror/mode/tornado/tornado.js';
import 'codemirror/mode/turtle/turtle.js';
import 'codemirror/mode/vb/vb.js';
import 'codemirror/mode/vbscript/vbscript.js';
import 'codemirror/mode/velocity/velocity.js';
import 'codemirror/mode/verilog/verilog.js';
import 'codemirror/mode/xml/xml.js';
import 'codemirror/mode/xquery/xquery.js';
import 'codemirror/mode/yaml/yaml.js';
import 'codemirror/mode/z80/z80.js';

// themes
// import 'codemirror/theme/3024-day.css';
// import 'codemirror/theme/3024-night.css';
// import 'codemirror/theme/ambiance-mobile.css';
// import 'codemirror/theme/ambiance.css';
// import 'codemirror/theme/base16-dark.css';
// import 'codemirror/theme/base16-light.css';
// import 'codemirror/theme/blackboard.css';
// import 'codemirror/theme/cobalt.css';
// import 'codemirror/theme/eclipse.css';
// import 'codemirror/theme/elegant.css';
// import 'codemirror/theme/erlang-dark.css';
// import 'codemirror/theme/lesser-dark.css';
// import 'codemirror/theme/mbo.css';
// import 'codemirror/theme/mdn-like.css';
// import 'codemirror/theme/midnight.css';
// import 'codemirror/theme/monokai.css';
// import 'codemirror/theme/neat.css';
// import 'codemirror/theme/neo.css';
// import 'codemirror/theme/night.css';
// import 'codemirror/theme/paraiso-dark.css';
// import 'codemirror/theme/paraiso-light.css';
// import 'codemirror/theme/pastel-on-dark.css';
// import 'codemirror/theme/rubyblue.css';
// import 'codemirror/theme/solarized.css';
// import 'codemirror/theme/the-matrix.css';
// import 'codemirror/theme/tomorrow-night-eighties.css';
// import 'codemirror/theme/twilight.css';
// import 'codemirror/theme/vibrant-ink.css';
// import 'codemirror/theme/xq-dark.css';
// import 'codemirror/theme/xq-light.css';

// key bindings
// import 'codemirror/keymap/emacs.js';
import 'codemirror/keymap/sublime.js';
// import 'codemirror/keymap/vim.js';
