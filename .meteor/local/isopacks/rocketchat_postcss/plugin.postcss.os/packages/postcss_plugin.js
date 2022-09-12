(function () {

/* Imports */
var ECMAScript = Package.ecmascript.ECMAScript;
var CssTools = Package['minifier-css'].CssTools;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"postcss":{"build.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                          //
// packages/postcss/build.js                                                                                //
//                                                                                                          //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                            //
let _objectSpread;

module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }

}, 0);
let CssTools;
module.link("meteor/minifier-css", {
  CssTools(v) {
    CssTools = v;
  }

}, 0);
let postcss;
module.link("postcss", {
  default(v) {
    postcss = v;
  }

}, 1);
let postcssrc;
module.link("postcss-load-config", {
  default(v) {
    postcssrc = v;
  }

}, 2);
let SourceMapConsumer, SourceMapGenerator;
module.link("source-map", {
  SourceMapConsumer(v) {
    SourceMapConsumer = v;
  },

  SourceMapGenerator(v) {
    SourceMapGenerator = v;
  }

}, 3);
let loaded = false;
let postcssConfigPlugins = [];
let postcssConfigParser = null;
let postcssConfigExcludedPackages = [];

const loadPostcssConfig = () => Promise.asyncApply(() => {
  if (loaded) {
    return;
  }

  try {
    const config = Promise.await(postcssrc({
      meteor: true
    }));
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
});

const isImportFile = _ref => {
  let {
    _source: {
      url
    }
  } = _ref;
  return /\.import\.css$/.test(url) || /(?:^|\/)imports\//.test(url);
};

const isInExcludedPackages = pathInBundle => postcssConfigExcludedPackages.some(packageName => pathInBundle.indexOf("packages/".concat(packageName.replace(':', '_'), "/")) > -1);

const handleFileError = (file, error) => {
  if (error.name === 'CssSyntaxError') {
    file.error({
      message: error.message,
      line: error.line,
      column: error.column
    });
    return;
  }

  if (error.reason) {
    file.error({
      message: error.reason,
      line: error.line,
      column: error.column
    });
    return;
  }

  file.error({
    message: error.message
  });
};

const getAbstractSyntaxTree = file => Promise.asyncApply(() => {
  const filename = file.getPathInBundle();

  if (isInExcludedPackages(filename)) {
    return Object.assign(CssTools.parseCss(file.getContentsAsString(), {
      source: filename,
      position: true
    }), {
      filename
    });
  }

  try {
    const postcssResult = Promise.await(postcss(postcssConfigPlugins).process(file.getContentsAsString(), {
      from: process.cwd() + file._source.url,
      parser: postcssConfigParser
    }));
    postcssResult.warnings().forEach(warn => {
      process.stderr.write(warn.toString());
    });
    return Object.assign(CssTools.parseCss(postcssResult.css, {
      source: filename,
      position: true
    }), {
      filename
    });
  } catch (error) {
    if (error.name === 'CssSyntaxError') {
      error.message = "".concat(error.message, "\n\nCss Syntax Error.\n\n").concat(error.message).concat(error.showSourceCode());
    }

    handleFileError(file, error);
    return {
      type: 'stylesheet',
      stylesheet: {
        rules: []
      },
      filename
    };
  }
});

const mergeCssFiles = files => Promise.asyncApply(() => {
  const cssAsts = Promise.await(Promise.all(files.map(getAbstractSyntaxTree)));
  const mergedCssAst = CssTools.mergeCssAsts(cssAsts, (filename, msg) => {
    console.warn("".concat(filename, ": warn: ").concat(msg));
  });
  const {
    code,
    map
  } = CssTools.stringifyCss(mergedCssAst, {
    sourcemap: true,
    inputSourcemaps: false
  });

  if (!code) {
    return {
      code: ''
    };
  }

  const mapFilenameToFile = files.reduce((obj, file) => _objectSpread(_objectSpread({}, obj), {}, {
    [file.getPathInBundle()]: file
  }), {});
  map.sourcesContent = map.sources.map(filename => mapFilenameToFile[filename].getContentsAsString()); // yes, this await is needed

  const consumer = Promise.await(new SourceMapConsumer(map));
  const newMap = SourceMapGenerator.fromSourceMap(consumer);
  consumer.destroy();
  files.filter(file => file.getSourceMap()).forEach(file => {
    newMap.applySourceMap(new SourceMapConsumer(file.getSourceMap()), file.getPathInBundle());
  });
  return {
    code,
    sourceMap: newMap.toString()
  };
});

const processFilesForBundle = function () {
  return Promise.asyncApply(() => {
    let files = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    let {
      minifyMode
    } = arguments.length > 1 ? arguments[1] : undefined;

    if (!files.length) {
      return;
    }

    Promise.await(loadPostcssConfig());
    const filesToMerge = files.filter(file => !isImportFile(file));
    const {
      code,
      sourceMap
    } = Promise.await(mergeCssFiles(filesToMerge));

    if (minifyMode === 'development') {
      files[0].addStylesheet({
        data: code,
        sourceMap,
        path: 'merged-stylesheets.css'
      });
      return;
    }

    const minifiedFiles = CssTools.minifyCss(code);
    minifiedFiles.forEach(data => {
      files[0].addStylesheet({
        data
      });
    });
  });
};

Plugin.registerMinifier({
  extensions: ['css']
}, () => ({
  processFilesForBundle
}));
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/postcss/build.js");

/* Exports */
Package._define("postcss");

})();

//# sourceURL=meteor://💻app/packages/postcss_plugin.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcG9zdGNzcy9idWlsZC5qcyJdLCJuYW1lcyI6WyJfb2JqZWN0U3ByZWFkIiwibW9kdWxlIiwibGluayIsImRlZmF1bHQiLCJ2IiwiQ3NzVG9vbHMiLCJwb3N0Y3NzIiwicG9zdGNzc3JjIiwiU291cmNlTWFwQ29uc3VtZXIiLCJTb3VyY2VNYXBHZW5lcmF0b3IiLCJsb2FkZWQiLCJwb3N0Y3NzQ29uZmlnUGx1Z2lucyIsInBvc3Rjc3NDb25maWdQYXJzZXIiLCJwb3N0Y3NzQ29uZmlnRXhjbHVkZWRQYWNrYWdlcyIsImxvYWRQb3N0Y3NzQ29uZmlnIiwiY29uZmlnIiwibWV0ZW9yIiwicGx1Z2lucyIsIm9wdGlvbnMiLCJwYXJzZXIiLCJleGNsdWRlZFBhY2thZ2VzIiwiZXJyb3IiLCJtZXNzYWdlIiwiaW5kZXhPZiIsImlzSW1wb3J0RmlsZSIsIl9zb3VyY2UiLCJ1cmwiLCJ0ZXN0IiwiaXNJbkV4Y2x1ZGVkUGFja2FnZXMiLCJwYXRoSW5CdW5kbGUiLCJzb21lIiwicGFja2FnZU5hbWUiLCJyZXBsYWNlIiwiaGFuZGxlRmlsZUVycm9yIiwiZmlsZSIsIm5hbWUiLCJsaW5lIiwiY29sdW1uIiwicmVhc29uIiwiZ2V0QWJzdHJhY3RTeW50YXhUcmVlIiwiZmlsZW5hbWUiLCJnZXRQYXRoSW5CdW5kbGUiLCJPYmplY3QiLCJhc3NpZ24iLCJwYXJzZUNzcyIsImdldENvbnRlbnRzQXNTdHJpbmciLCJzb3VyY2UiLCJwb3NpdGlvbiIsInBvc3Rjc3NSZXN1bHQiLCJwcm9jZXNzIiwiZnJvbSIsImN3ZCIsIndhcm5pbmdzIiwiZm9yRWFjaCIsIndhcm4iLCJzdGRlcnIiLCJ3cml0ZSIsInRvU3RyaW5nIiwiY3NzIiwic2hvd1NvdXJjZUNvZGUiLCJ0eXBlIiwic3R5bGVzaGVldCIsInJ1bGVzIiwibWVyZ2VDc3NGaWxlcyIsImZpbGVzIiwiY3NzQXN0cyIsIlByb21pc2UiLCJhbGwiLCJtYXAiLCJtZXJnZWRDc3NBc3QiLCJtZXJnZUNzc0FzdHMiLCJtc2ciLCJjb25zb2xlIiwiY29kZSIsInN0cmluZ2lmeUNzcyIsInNvdXJjZW1hcCIsImlucHV0U291cmNlbWFwcyIsIm1hcEZpbGVuYW1lVG9GaWxlIiwicmVkdWNlIiwib2JqIiwic291cmNlc0NvbnRlbnQiLCJzb3VyY2VzIiwiY29uc3VtZXIiLCJuZXdNYXAiLCJmcm9tU291cmNlTWFwIiwiZGVzdHJveSIsImZpbHRlciIsImdldFNvdXJjZU1hcCIsImFwcGx5U291cmNlTWFwIiwic291cmNlTWFwIiwicHJvY2Vzc0ZpbGVzRm9yQnVuZGxlIiwibWluaWZ5TW9kZSIsImxlbmd0aCIsImZpbGVzVG9NZXJnZSIsImFkZFN0eWxlc2hlZXQiLCJkYXRhIiwicGF0aCIsIm1pbmlmaWVkRmlsZXMiLCJtaW5pZnlDc3MiLCJQbHVnaW4iLCJyZWdpc3Rlck1pbmlmaWVyIiwiZXh0ZW5zaW9ucyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLGFBQUo7O0FBQWtCQyxNQUFNLENBQUNDLElBQVAsQ0FBWSxzQ0FBWixFQUFtRDtBQUFDQyxTQUFPLENBQUNDLENBQUQsRUFBRztBQUFDSixpQkFBYSxHQUFDSSxDQUFkO0FBQWdCOztBQUE1QixDQUFuRCxFQUFpRixDQUFqRjtBQUFsQixJQUFJQyxRQUFKO0FBQWFKLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLHFCQUFaLEVBQWtDO0FBQUNHLFVBQVEsQ0FBQ0QsQ0FBRCxFQUFHO0FBQUNDLFlBQVEsR0FBQ0QsQ0FBVDtBQUFXOztBQUF4QixDQUFsQyxFQUE0RCxDQUE1RDtBQUErRCxJQUFJRSxPQUFKO0FBQVlMLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLFNBQVosRUFBc0I7QUFBQ0MsU0FBTyxDQUFDQyxDQUFELEVBQUc7QUFBQ0UsV0FBTyxHQUFDRixDQUFSO0FBQVU7O0FBQXRCLENBQXRCLEVBQThDLENBQTlDO0FBQWlELElBQUlHLFNBQUo7QUFBY04sTUFBTSxDQUFDQyxJQUFQLENBQVkscUJBQVosRUFBa0M7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SyxDQUFDLENBQUQsQ0FBTCxDQUFTOEIsYUFBVCxDQUF1QjtBQUN0QkMsWUFBSSxFQUFFdEIsSUFEZ0I7QUFFdEJnQixpQkFGc0I7QUFHdEJPLFlBQUksRUFBRTtBQUhnQixPQUF2QjtBQUtBO0FBQ0E7O0FBRUQsVUFBTUMsYUFBYSxHQUFHNUYsUUFBUSxDQUFDNkYsU0FBVCxDQUFtQnpCLElBQW5CLENBQXRCO0FBRUF3QixpQkFBYSxDQUFDNUMsT0FBZCxDQUF1QjBDLElBQUQsSUFBVTtBQUMvQi9CLFdBQUssQ0FBQyxDQUFELENBQUwsQ0FBUzhCLGFBQVQsQ0FBdUI7QUFBRUM7QUFBRixPQUF2QjtBQUNBLEtBRkQ7QUFHQSxHQXpCNkI7QUFBQSxDQUE5Qjs7QUEyQkFJLE1BQU0sQ0FBQ0MsZ0JBQVAsQ0FBd0I7QUFBRUMsWUFBVSxFQUFFLENBQUMsS0FBRDtBQUFkLENBQXhCLEVBQWlELE9BQU87QUFDdkRYO0FBRHVELENBQVAsQ0FBakQsRSIsImZpbGUiOiIvcGFja2FnZXMvcG9zdGNzc19wbHVnaW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDc3NUb29scyB9IGZyb20gJ21ldGVvci9taW5pZmllci1jc3MnO1xuaW1wb3J0IHBvc3Rjc3MgZnJvbSAncG9zdGNzcyc7XG5pbXBvcnQgcG9zdGNzc3JjIGZyb20gJ3Bvc3Rjc3MtbG9hZC1jb25maWcnO1xuaW1wb3J0IHsgU291cmNlTWFwQ29uc3VtZXIsIFNvdXJjZU1hcEdlbmVyYXRvciB9IGZyb20gJ3NvdXJjZS1tYXAnO1xuXG5sZXQgbG9hZGVkID0gZmFsc2U7XG5sZXQgcG9zdGNzc0NvbmZpZ1BsdWdpbnMgPSBbXTtcbmxldCBwb3N0Y3NzQ29uZmlnUGFyc2VyID0gbnVsbDtcbmxldCBwb3N0Y3NzQ29uZmlnRXhjbHVkZWRQYWNrYWdlcyA9IFtdO1xuXG5jb25zdCBsb2FkUG9zdGNzc0NvbmZpZyA9IGFzeW5jICgpID0+IHtcblx0aWYgKGxvYWRlZCkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdHRyeSB7XG5cdFx0Y29uc3QgY29uZmlnID0gYXdhaXQgcG9zdGNzc3JjKHsgbWV0ZW9yOiB0cnVlIH0pO1xuXHRcdHBvc3Rjc3NDb25maWdQbHVnaW5zID0gY29uZmlnLnBsdWdpbnMgfHwgW107XG5cdFx0cG9zdGNzc0NvbmZpZ1BhcnNlciA9IGNvbmZpZy5vcHRpb25zLnBhcnNlciB8fCBudWxsO1xuXHRcdHBvc3Rjc3NDb25maWdFeGNsdWRlZFBhY2thZ2VzID0gY29uZmlnLm9wdGlvbnMuZXhjbHVkZWRQYWNrYWdlcyB8fCBbXTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRpZiAoZXJyb3IubWVzc2FnZS5pbmRleE9mKCdObyBQb3N0Q1NTIENvbmZpZyBmb3VuZCcpIDwgMCkge1xuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fVxuXHR9IGZpbmFsbHkge1xuXHRcdGxvYWRlZCA9IHRydWU7XG5cdH1cbn07XG5cbmNvbnN0IGlzSW1wb3J0RmlsZSA9ICh7IF9zb3VyY2U6IHsgdXJsIH0gfSkgPT4gL1xcLmltcG9ydFxcLmNzcyQvLnRlc3QodXJsKSB8fCAvKD86XnxcXC8paW1wb3J0c1xcLy8udGVzdCh1cmwpO1xuXG5jb25zdCBpc0luRXhjbHVkZWRQYWNrYWdlcyA9IChwYXRoSW5CdW5kbGUpID0+XG5cdHBvc3Rjc3NDb25maWdFeGNsdWRlZFBhY2thZ2VzLnNvbWUoKHBhY2thZ2VOYW1lKSA9PiBwYXRoSW5CdW5kbGUuaW5kZXhPZihgcGFja2FnZXMvJHtwYWNrYWdlTmFtZS5yZXBsYWNlKCc6JywgJ18nKX0vYCkgPiAtMSk7XG5cbmNvbnN0IGhhbmRsZUZpbGVFcnJvciA9IChmaWxlLCBlcnJvcikgPT4ge1xuXHRpZiAoZXJyb3IubmFtZSA9PT0gJ0Nzc1N5bnRheEVycm9yJykge1xuXHRcdGZpbGUuZXJyb3Ioe1xuXHRcdFx0bWVzc2FnZTogZXJyb3IubWVzc2FnZSxcblx0XHRcdGxpbmU6IGVycm9yLmxpbmUsXG5cdFx0XHRjb2x1bW46IGVycm9yLmNvbHVtbixcblx0XHR9KTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRpZiAoZXJyb3IucmVhc29uKSB7XG5cdFx0ZmlsZS5lcnJvcih7XG5cdFx0XHRtZXNzYWdlOiBlcnJvci5yZWFzb24sXG5cdFx0XHRsaW5lOiBlcnJvci5saW5lLFxuXHRcdFx0Y29sdW1uOiBlcnJvci5jb2x1bW4sXG5cdFx0fSk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0ZmlsZS5lcnJvcih7IG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfSk7XG59O1xuXG5jb25zdCBnZXRBYnN0cmFjdFN5bnRheFRyZWUgPSBhc3luYyAoZmlsZSkgPT4ge1xuXHRjb25zdCBmaWxlbmFtZSA9IGZpbGUuZ2V0UGF0aEluQnVuZGxlKCk7XG5cblx0aWYgKGlzSW5FeGNsdWRlZFBhY2thZ2VzKGZpbGVuYW1lKSkge1xuXHRcdHJldHVybiBPYmplY3QuYXNzaWduKFxuXHRcdFx0Q3NzVG9vbHMucGFyc2VDc3MoZmlsZS5nZXRDb250ZW50c0FzU3RyaW5nKCksIHtcblx0XHRcdFx0c291cmNlOiBmaWxlbmFtZSxcblx0XHRcdFx0cG9zaXRpb246IHRydWUsXG5cdFx0XHR9KSxcblx0XHRcdHsgZmlsZW5hbWUgfSxcblx0XHQpO1xuXHR9XG5cblx0dHJ5IHtcblx0XHRjb25zdCBwb3N0Y3NzUmVzdWx0ID0gYXdhaXQgcG9zdGNzcyhwb3N0Y3NzQ29uZmlnUGx1Z2lucykucHJvY2VzcyhmaWxlLmdldENvbnRlbnRzQXNTdHJpbmcoKSwge1xuXHRcdFx0ZnJvbTogcHJvY2Vzcy5jd2QoKSArIGZpbGUuX3NvdXJjZS51cmwsXG5cdFx0XHRwYXJzZXI6IHBvc3Rjc3NDb25maWdQYXJzZXIsXG5cdFx0fSk7XG5cblx0XHRwb3N0Y3NzUmVzdWx0Lndhcm5pbmdzKCkuZm9yRWFjaCgod2FybikgPT4ge1xuXHRcdFx0cHJvY2Vzcy5zdGRlcnIud3JpdGUod2Fybi50b1N0cmluZygpKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBPYmplY3QuYXNzaWduKFxuXHRcdFx0Q3NzVG9vbHMucGFyc2VDc3MocG9zdGNzc1Jlc3VsdC5jc3MsIHtcblx0XHRcdFx0c291cmNlOiBmaWxlbmFtZSxcblx0XHRcdFx0cG9zaXRpb246IHRydWUsXG5cdFx0XHR9KSxcblx0XHRcdHsgZmlsZW5hbWUgfSxcblx0XHQpO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdGlmIChlcnJvci5uYW1lID09PSAnQ3NzU3ludGF4RXJyb3InKSB7XG5cdFx0XHRlcnJvci5tZXNzYWdlID0gYCR7ZXJyb3IubWVzc2FnZX1cXG5cXG5Dc3MgU3ludGF4IEVycm9yLlxcblxcbiR7ZXJyb3IubWVzc2FnZX0ke2Vycm9yLnNob3dTb3VyY2VDb2RlKCl9YDtcblx0XHR9XG5cblx0XHRoYW5kbGVGaWxlRXJyb3IoZmlsZSwgZXJyb3IpO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdzdHlsZXNoZWV0Jyxcblx0XHRcdHN0eWxlc2hlZXQ6IHtcblx0XHRcdFx0cnVsZXM6IFtdLFxuXHRcdFx0fSxcblx0XHRcdGZpbGVuYW1lLFxuXHRcdH07XG5cdH1cbn07XG5cbmNvbnN0IG1lcmdlQ3NzRmlsZXMgPSBhc3luYyAoZmlsZXMpID0+IHtcblx0Y29uc3QgY3NzQXN0cyA9IGF3YWl0IFByb21pc2UuYWxsKGZpbGVzLm1hcChnZXRBYnN0cmFjdFN5bnRheFRyZWUpKTtcblxuXHRjb25zdCBtZXJnZWRDc3NBc3QgPSBDc3NUb29scy5tZXJnZUNzc0FzdHMoY3NzQXN0cywgKGZpbGVuYW1lLCBtc2cpID0+IHtcblx0XHRjb25zb2xlLndhcm4oYCR7ZmlsZW5hbWV9OiB3YXJuOiAke21zZ31gKTtcblx0fSk7XG5cblx0Y29uc3QgeyBjb2RlLCBtYXAgfSA9IENzc1Rvb2xzLnN0cmluZ2lmeUNzcyhtZXJnZWRDc3NBc3QsIHtcblx0XHRzb3VyY2VtYXA6IHRydWUsXG5cdFx0aW5wdXRTb3VyY2VtYXBzOiBmYWxzZSxcblx0fSk7XG5cblx0aWYgKCFjb2RlKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvZGU6ICcnLFxuXHRcdH07XG5cdH1cblxuXHRjb25zdCBtYXBGaWxlbmFtZVRvRmlsZSA9IGZpbGVzLnJlZHVjZShcblx0XHQob2JqLCBmaWxlKSA9PiAoe1xuXHRcdFx0Li4ub2JqLFxuXHRcdFx0W2ZpbGUuZ2V0UGF0aEluQnVuZGxlKCldOiBmaWxlLFxuXHRcdH0pLFxuXHRcdHt9LFxuXHQpO1xuXG5cdG1hcC5zb3VyY2VzQ29udGVudCA9IG1hcC5zb3VyY2VzLm1hcCgoZmlsZW5hbWUpID0+IG1hcEZpbGVuYW1lVG9GaWxlW2ZpbGVuYW1lXS5nZXRDb250ZW50c0FzU3RyaW5nKCkpO1xuXG5cdC8vIHllcywgdGhpcyBhd2FpdCBpcyBuZWVkZWRcblx0Y29uc3QgY29uc3VtZXIgPSBhd2FpdCBuZXcgU291cmNlTWFwQ29uc3VtZXIobWFwKTtcblxuXHRjb25zdCBuZXdNYXAgPSBTb3VyY2VNYXBHZW5lcmF0b3IuZnJvbVNvdXJjZU1hcChjb25zdW1lcik7XG5cblx0Y29uc3VtZXIuZGVzdHJveSgpO1xuXG5cdGZpbGVzXG5cdFx0LmZpbHRlcigoZmlsZSkgPT4gZmlsZS5nZXRTb3VyY2VNYXAoKSlcblx0XHQuZm9yRWFjaCgoZmlsZSkgPT4ge1xuXHRcdFx0bmV3TWFwLmFwcGx5U291cmNlTWFwKG5ldyBTb3VyY2VNYXBDb25zdW1lcihmaWxlLmdldFNvdXJjZU1hcCgpKSwgZmlsZS5nZXRQYXRoSW5CdW5kbGUoKSk7XG5cdFx0fSk7XG5cblx0cmV0dXJuIHtcblx0XHRjb2RlLFxuXHRcdHNvdXJjZU1hcDogbmV3TWFwLnRvU3RyaW5nKCksXG5cdH07XG59O1xuXG5jb25zdCBwcm9jZXNzRmlsZXNGb3JCdW5kbGUgPSBhc3luYyAoZmlsZXMgPSBbXSwgeyBtaW5pZnlNb2RlIH0pID0+IHtcblx0aWYgKCFmaWxlcy5sZW5ndGgpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRhd2FpdCBsb2FkUG9zdGNzc0NvbmZpZygpO1xuXG5cdGNvbnN0IGZpbGVzVG9NZXJnZSA9IGZpbGVzLmZpbHRlcigoZmlsZSkgPT4gIWlzSW1wb3J0RmlsZShmaWxlKSk7XG5cblx0Y29uc3QgeyBjb2RlLCBzb3VyY2VNYXAgfSA9IGF3YWl0IG1lcmdlQ3NzRmlsZXMoZmlsZXNUb01lcmdlKTtcblxuXHRpZiAobWluaWZ5TW9kZSA9PT0gJ2RldmVsb3BtZW50Jykge1xuXHRcdGZpbGVzWzBdLmFkZFN0eWxlc2hlZXQoe1xuXHRcdFx0ZGF0YTogY29kZSxcblx0XHRcdHNvdXJjZU1hcCxcblx0XHRcdHBhdGg6ICdtZXJnZWQtc3R5bGVzaGVldHMuY3NzJyxcblx0XHR9KTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBtaW5pZmllZEZpbGVzID0gQ3NzVG9vbHMubWluaWZ5Q3NzKGNvZGUpO1xuXG5cdG1pbmlmaWVkRmlsZXMuZm9yRWFjaCgoZGF0YSkgPT4ge1xuXHRcdGZpbGVzWzBdLmFkZFN0eWxlc2hlZXQoeyBkYXRhIH0pO1xuXHR9KTtcbn07XG5cblBsdWdpbi5yZWdpc3Rlck1pbmlmaWVyKHsgZXh0ZW5zaW9uczogWydjc3MnXSB9LCAoKSA9PiAoe1xuXHRwcm9jZXNzRmlsZXNGb3JCdW5kbGUsXG59KSk7XG4iXX0=
