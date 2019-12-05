import Future from 'fibers/future';
import { CssTools } from 'meteor/minifier-css';

require('app-module-path/cwd');
const postCSS = require('postcss');
const load = require('postcss-load-config');
const sourcemap = require('source-map');

let loaded = false;
let postcssConfigPlugins = [];
let postcssConfigParser = null;
let postcssConfigExcludedPackages = [];
let ast;

const isNotInExcludedPackages = function(excludedPackages, pathInBundle) {
	let processedPackageName;
	let exclArr = [];
	if (excludedPackages && excludedPackages instanceof Array) {
		exclArr = excludedPackages.map((packageName) => {
			processedPackageName = packageName && packageName.replace(':', '_');
			return pathInBundle && pathInBundle.indexOf(`packages/${ processedPackageName }`) > -1;
		});
	}
	return exclArr.indexOf(true) === -1;
};

const mergeCss = function(css) {
	// Filenames passed to AST manipulator mapped to their original files
	const originals = {};

	const cssAsts = css.map(function(file) {
		const filename = file.getPathInBundle();
		originals[filename] = file;

		const f = new Future();

		let css;
		let postres;
		let isFileForPostCSS;

		if (isNotInExcludedPackages(postcssConfigExcludedPackages, file.getPathInBundle())) {
			isFileForPostCSS = true;
		} else {
			isFileForPostCSS = false;
		}

		postCSS(isFileForPostCSS ? postcssConfigPlugins : [])
			.process(file.getContentsAsString(), {
				from: process.cwd() + file._source.url,
				parser: postcssConfigParser,
			})
			.then(function(result) {
				result.warnings().forEach(function(warn) {
					process.stderr.write(warn.toString());
				});
				f.return(result);
			})
			.catch(function(error) {
				let errMsg = error.message;
				if (error.name === 'CssSyntaxError') {
					errMsg = `${ error.message }\n\nCss Syntax Error.\n\n${ error.message }${ error.showSourceCode() }`;
				}
				error.message = errMsg;
				f.return(error);
			});

		try {
			const parseOptions = {
				source: filename,
				position: true,
			};

			postres = f.wait();

			if (postres.name === 'CssSyntaxError') {
				throw postres;
			}

			css = postres.css;

			ast = CssTools.parseCss(css, parseOptions);
			ast.filename = filename;
		} catch (e) {
			if (e.name === 'CssSyntaxError') {
				file.error({
					message: e.message,
					line: e.line,
					column: e.column,
				});
			} else if (e.reason) {
				file.error({
					message: e.reason,
					line: e.line,
					column: e.column,
				});
			} else {
				// Just in case it's not the normal error the library makes.
				file.error({
					message: e.message,
				});
			}

			return {
				type: 'stylesheet',
				stylesheet: {
					rules: [],
				},
				filename,
			};
		}

		return ast;
	});

	const warnCb = function(filename, msg) {
		// XXX make this a buildmessage.warning call rather than a random log.
		//     this API would be like buildmessage.error, but wouldn't cause
		//     the build to fail.
		console.log(`${ filename }: warn: ${ msg }`);
	};

	const mergedCssAst = CssTools.mergeCssAsts(cssAsts, warnCb);

	// Overwrite the CSS files list with the new concatenated file
	const stringifiedCss = CssTools.stringifyCss(mergedCssAst, {
		sourcemap: true,
		// don't try to read the referenced sourcemaps from the input
		inputSourcemaps: false,
	});

	if (!stringifiedCss.code) {
		return {
			code: '',
		};
	}

	// Add the contents of the input files to the source map of the new file
	stringifiedCss.map.sourcesContent = stringifiedCss.map.sources.map(function(filename) {
		return originals[filename].getContentsAsString();
	});

	// If any input files had source maps, apply them.
	// Ex.: less -> css source map should be composed with css -> css source map
	const newMap = sourcemap.SourceMapGenerator.fromSourceMap(
		new sourcemap.SourceMapConsumer(stringifiedCss.map));

	Object.keys(originals).forEach(function(name) {
		const file = originals[name];
		if (!file.getSourceMap()) { return; }
		try {
			newMap.applySourceMap(
				new sourcemap.SourceMapConsumer(file.getSourceMap()), name);
		} catch (err) {
			// If we can't apply the source map, silently drop it.
			//
			// XXX This is here because there are some less files that
			// produce source maps that throw when consumed. We should
			// figure out exactly why and fix it, but this will do for now.
		}
	});

	return {
		code: stringifiedCss.code,
		sourceMap: newMap.toString(),
	};
};

const loadPostcssConfig = function() {
	if (!loaded) {
		loaded = true;

		let config;
		try {
			config = Promise.await(load({ meteor: true }));
			postcssConfigPlugins = config.plugins || [];
			postcssConfigParser = config.options.parser || null;
			postcssConfigExcludedPackages = config.options.excludedPackages || [];
			// There is also "config.file" which is a path to the file we use to force
			// Meteor reload on any change, but it seems this is not (yet) possible.
		} catch (error) {
			// Do not emit an error if the error is that no config can be found.
			if (error.message.indexOf('No PostCSS Config found') < 0) {
				throw error;
			}
		}
	}
};

const isNotImport = function(inputFileUrl) {
	return !(/\.import\.css$/.test(inputFileUrl)
             || /(?:^|\/)imports\//.test(inputFileUrl));
};

function CssToolsMinifier() {}

CssToolsMinifier.prototype.processFilesForBundle = function(files, options) {
	loadPostcssConfig();

	const mode = options.minifyMode;

	if (!files.length) { return; }

	const filesToMerge = [];

	files.forEach(function(file) {
		if (isNotImport(file._source.url)) {
			filesToMerge.push(file);
		}
	});

	const merged = mergeCss(filesToMerge);

	if (mode === 'development') {
		files[0].addStylesheet({
			data: merged.code,
			sourceMap: merged.sourceMap,
			path: 'merged-stylesheets.css',
		});
		return;
	}

	const minifiedFiles = CssTools.minifyCss(merged.code);

	if (files.length) {
		minifiedFiles.forEach(function(minified) {
			files[0].addStylesheet({
				data: minified,
			});
		});
	}
};

Plugin.registerMinifier({ extensions: ['css'] }, () => ({
	processFilesForBundle: CssToolsMinifier.prototype.processFilesForBundle,
}));
