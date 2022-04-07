import { CssTools } from 'meteor/minifier-css';
import postcss from 'postcss';
import postcssrc from 'postcss-load-config';
import { SourceMapConsumer, SourceMapGenerator } from 'source-map';

let loaded = false;
let postcssConfigPlugins = [];
let postcssConfigParser = null;
let postcssConfigExcludedPackages = [];

const loadPostcssConfig = async () => {
	if (loaded) {
		return;
	}

	try {
		const config = await postcssrc({ meteor: true });
		postcssConfigPlugins = config.plugins || [];
		postcssConfigParser = config.options.parser || null;
		postcssConfigExcludedPackages = config.options.excludedPackages || [];
	} catch (error) {
		if (error.message.indexOf('No PostCSS Config found') < 0) {
			throw error;
		}
	} finally {
		loaded = true;
	}
};

const isImportFile = ({ _source: { url } }) => /\.import\.css$/.test(url) || /(?:^|\/)imports\//.test(url);

const isInExcludedPackages = (pathInBundle) =>
	postcssConfigExcludedPackages.some((packageName) => pathInBundle.indexOf(`packages/${packageName.replace(':', '_')}/`) > -1);

const handleFileError = (file, error) => {
	if (error.name === 'CssSyntaxError') {
		file.error({
			message: error.message,
			line: error.line,
			column: error.column,
		});
		return;
	}

	if (error.reason) {
		file.error({
			message: error.reason,
			line: error.line,
			column: error.column,
		});
		return;
	}

	file.error({ message: error.message });
};

const getAbstractSyntaxTree = async (file) => {
	const filename = file.getPathInBundle();

	if (isInExcludedPackages(filename)) {
		return Object.assign(
			CssTools.parseCss(file.getContentsAsString(), {
				source: filename,
				position: true,
			}),
			{ filename },
		);
	}

	try {
		const postcssResult = await postcss(postcssConfigPlugins).process(file.getContentsAsString(), {
			from: process.cwd() + file._source.url,
			parser: postcssConfigParser,
		});

		postcssResult.warnings().forEach((warn) => {
			process.stderr.write(warn.toString());
		});

		return Object.assign(
			CssTools.parseCss(postcssResult.css, {
				source: filename,
				position: true,
			}),
			{ filename },
		);
	} catch (error) {
		if (error.name === 'CssSyntaxError') {
			error.message = `${error.message}\n\nCss Syntax Error.\n\n${error.message}${error.showSourceCode()}`;
		}

		handleFileError(file, error);

		return {
			type: 'stylesheet',
			stylesheet: {
				rules: [],
			},
			filename,
		};
	}
};

const mergeCssFiles = async (files) => {
	const cssAsts = await Promise.all(files.map(getAbstractSyntaxTree));

	const mergedCssAst = CssTools.mergeCssAsts(cssAsts, (filename, msg) => {
		console.warn(`${filename}: warn: ${msg}`);
	});

	const { code, map } = CssTools.stringifyCss(mergedCssAst, {
		sourcemap: true,
		inputSourcemaps: false,
	});

	if (!code) {
		return {
			code: '',
		};
	}

	const mapFilenameToFile = files.reduce(
		(obj, file) => ({
			...obj,
			[file.getPathInBundle()]: file,
		}),
		{},
	);

	map.sourcesContent = map.sources.map((filename) => mapFilenameToFile[filename].getContentsAsString());

	// yes, this await is needed
	const consumer = await new SourceMapConsumer(map);

	const newMap = SourceMapGenerator.fromSourceMap(consumer);

	consumer.destroy();

	files
		.filter((file) => file.getSourceMap())
		.forEach((file) => {
			newMap.applySourceMap(new SourceMapConsumer(file.getSourceMap()), file.getPathInBundle());
		});

	return {
		code,
		sourceMap: newMap.toString(),
	};
};

const processFilesForBundle = async (files = [], { minifyMode }) => {
	if (!files.length) {
		return;
	}

	await loadPostcssConfig();

	const filesToMerge = files.filter((file) => !isImportFile(file));

	const { code, sourceMap } = await mergeCssFiles(filesToMerge);

	if (minifyMode === 'development') {
		files[0].addStylesheet({
			data: code,
			sourceMap,
			path: 'merged-stylesheets.css',
		});
		return;
	}

	const minifiedFiles = CssTools.minifyCss(code);

	minifiedFiles.forEach((data) => {
		files[0].addStylesheet({ data });
	});
};

Plugin.registerMinifier({ extensions: ['css'] }, () => ({
	processFilesForBundle,
}));
