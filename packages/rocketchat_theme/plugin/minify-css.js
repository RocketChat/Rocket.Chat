import 'app-module-path/cwd';
import { CssTools } from 'meteor/minifier-css/minifier';
import { Promise } from 'meteor/promise';
import Future from 'fibers/future';
import sourcemap from 'source-map';
import postCSS from 'postcss';
import loadConfig from 'postcss-load-config';


let loaded = false;
let postcssConfigPlugins = [];
let postcssConfigParser = null;
let postcssConfigExcludedPackages = [];

const loadPostcssConfig = () => {
	if (!loaded) {
		loaded = true;

		let config;

		try {
			config = Promise.await(loadConfig({ meteor: true }));
			postcssConfigPlugins = config.plugins || [];
			postcssConfigParser = config.options.parser || null;
			postcssConfigExcludedPackages = config.options.excludedPackages || [];
		} catch (error) {
			if (error.message.indexOf('No PostCSS Config found') < 0) {
				throw error;
			}
		}
	}
};

const isNotInExcludedPackages = (excludedPackages, pathInBundle) => {
	if (!Array.isArray(excludedPackages)) {
		return false;
	}

	return !excludedPackages.some((packageName) => {
		const processedPackageName = packageName && packageName.replace(':', '_');
		return pathInBundle && pathInBundle.indexOf(`packages/${ processedPackageName }`) > -1;
	});
};

const isNotImport = (inputFileUrl) => !(/\.import\.css$/.test(inputFileUrl) ||
	/(?:^|\/)imports\//.test(inputFileUrl));

const mergeCss = function(css) {
	const originals = {};

	const cssAsts = css.map(function(file) {
		const filename = file.getPathInBundle();
		originals[filename] = file;

		const f = new Future;

		const isFileForPostCSS = isNotInExcludedPackages(postcssConfigExcludedPackages, file.getPathInBundle());

		let css;
		let postres;

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

		let ast;
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

	const warnCb = (filename, msg) => {
		console.log(`${ filename }: warn: ${ msg }`);
	};

	const mergedCssAst = CssTools.mergeCssAsts(cssAsts, warnCb);

	const stringifiedCss = CssTools.stringifyCss(mergedCssAst, {
		sourcemap: true,
		inputSourcemaps: false,
	});

	if (!stringifiedCss.code) {
		return { code: '' };
	}

	stringifiedCss.map.sourcesContent = stringifiedCss.map.sources.map(
		(filename) => originals[filename].getContentsAsString());

	const newMap = sourcemap.SourceMapGenerator.fromSourceMap(new sourcemap.SourceMapConsumer(stringifiedCss.map));

	Object.entries(originals).forEach(([name, file]) => {
		if (!file.getSourceMap()) {
			return;
		}

		try {
			newMap.applySourceMap(new sourcemap.SourceMapConsumer(file.getSourceMap()), name);
		} catch (err) {
			// If we can't apply the source map, silently drop it.
		}
	});

	return {
		code: stringifiedCss.code,
		sourceMap: newMap.toString(),
	};
};


const processFilesForBundle = (files, options) => {
	loadPostcssConfig();

	const mode = options.minifyMode;

	if (!files.length) {
		return;
	}

	const filesToMerge = [];

	files.forEach((file) => {
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
		minifiedFiles.forEach((data) => {
			files[0].addStylesheet({ data });
		});
	}
};

Plugin.registerMinifier({
	extensions: ['css'],
}, () => ({ processFilesForBundle }));
