/* global CssTools */

import appModulePath from 'app-module-path';
import Future from 'fibers/future';
import fs from 'fs';
import path from 'path';
import postCSS from 'postcss';
import sourcemap from 'source-map';

appModulePath.addPath(`${ process.cwd() }/node_modules/`);

const postCSSConfigFile = path.resolve(process.cwd(), '.postcssrc');

const postCSSConfig = JSON.parse(fs.readFileSync(postCSSConfigFile));

const getPostCSSPlugins = () => {
	const plugins = [];
	if (postCSSConfig.plugins) {
		Object.keys(postCSSConfig.plugins).forEach((pluginName) => {
			const postCSSPlugin = require(pluginName);
			if (postCSSPlugin && postCSSPlugin().postcssPlugin) {
				plugins.push(postCSSPlugin(postCSSConfig.plugins ? postCSSConfig.plugins[pluginName] : {}));
			}
		});
	}

	return plugins;
};

const getExcludedPackages = () => {
	if (postCSSConfig.excludedPackages && postCSSConfig.excludedPackages instanceof Array) {
		return postCSSConfig.excludedPackages;
	}

	return false;
};

const isNotInExcludedPackages = (excludedPackages, pathInBundle) => {
	let exclArr = [];
	if (excludedPackages && excludedPackages instanceof Array) {
		exclArr = excludedPackages.map(packageName => {
			return pathInBundle && pathInBundle.indexOf(`packages/${ packageName.replace(':', '_') }`) > -1;
		});
	}

	return exclArr.indexOf(true) === -1;
};

const isNotImport = inputFileUrl => !(/\.import\.css$/.test(inputFileUrl) || /(?:^|\/)imports\//.test(inputFileUrl));

const mergeCss = css => {
	const originals = {};
	const excludedPackagesArr = getExcludedPackages();

	const cssAsts = css.map(file => {
		const filename = file.getPathInBundle();
		originals[filename] = file;

		const f = new Future;

		let css;
		let postres;
		const isFileForPostCSS = isNotInExcludedPackages(excludedPackagesArr, file.getPathInBundle());
		postCSS(isFileForPostCSS ? getPostCSSPlugins() : [])
			.process(file.getContentsAsString(), {
				from: process.cwd() + file._source.url.replace('_', '-')
			})
			.then(result => {
				result.warnings().forEach(warn => {
					process.stderr.write(warn.toString());
				});
				f.return(result);
			})
			.catch(error => {
				if (error.name === 'CssSyntaxError') {
					error.message = `${ error.message }\n\nCss Syntax Error.\n\n${ error.message }${ error.showSourceCode() }`;
				}
				f.return(error);
			});

		try {
			const parseOptions = {
				source: filename,
				position: true
			};

			postres = f.wait();

			if (postres.name === 'CssSyntaxError') {
				throw postres;
			}

			css = postres.css;

			const ast = CssTools.parseCss(css, parseOptions);
			ast.filename = filename;

			return ast;
		} catch (e) {
			if (e.name === 'CssSyntaxError') {
				file.error({
					message: e.message,
					line: e.line,
					column: e.column
				});
			} else if (e.reason) {
				file.error({
					message: e.reason,
					line: e.line,
					column: e.column
				});
			} else {
				file.error({
					message: e.message
				});
			}

			return {
				type: 'stylesheet',
				stylesheet: { rules: [] },
				filename
			};
		}
	});
	const mergedCssAst = CssTools.mergeCssAsts(cssAsts, (filename, msg) => {
		console.log(`${ filename }: warn: ${ msg }`);
	});

	const stringifiedCss = CssTools.stringifyCss(mergedCssAst, {
		sourcemap: true,
		inputSourcemaps: false
	});

	if (!stringifiedCss.code) {
		return { code: '' };
	}

	stringifiedCss.map.sourcesContent =
		stringifiedCss.map.sources.map(filename => {
			return originals[filename].getContentsAsString();
		});

	const newMap = sourcemap.SourceMapGenerator.fromSourceMap(new sourcemap.SourceMapConsumer(stringifiedCss.map));

	Object.keys(originals).forEach(name => {
		const file = originals[name];
		if (!file.getSourceMap()) {
			return false;
		}
		try {
			newMap.applySourceMap(new sourcemap.SourceMapConsumer(file.getSourceMap()), name);
		} catch (err) {
			// If can't apply the source map, silently drop it.
		}
	});

	return {
		code: stringifiedCss.code,
		sourceMap: newMap.toString()
	};
};

class CssToolsMinifier {
	processFilesForBundle(files, options) {
		const mode = options.minifyMode;

		if (!files.length) {
			return false;
		}

		const filesToMerge = [];

		files.forEach(file => {
			if (isNotImport(file._source.url)) {
				filesToMerge.push(file);
			}
		});

		const merged = mergeCss(filesToMerge);

		if (mode === 'development') {
			files[0].addStylesheet({
				data: merged.code,
				sourceMap: merged.sourceMap,
				path: 'merged-stylesheets.css'
			});
			return false;
		}

		const minifiedFiles = CssTools.minifyCss(merged.code);

		if (files.length) {
			minifiedFiles.forEach(minified => {
				files[0].addStylesheet({
					data: minified
				});
			});
		}
	}
}

Plugin.registerMinifier({extensions: ['css']}, () => new CssToolsMinifier);
