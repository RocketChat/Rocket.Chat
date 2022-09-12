(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var transformResult, CssTools;

var require = meteorInstall({"node_modules":{"meteor":{"minifier-css":{"minifier.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/minifier-css/minifier.js                                                                               //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
!function (module1) {
  module1.export({
    CssTools: () => CssTools
  });
  let path;
  module1.link("path", {
    default(v) {
      path = v;
    }

  }, 0);
  let url;
  module1.link("url", {
    default(v) {
      url = v;
    }

  }, 1);
  let Future;
  module1.link("fibers/future", {
    default(v) {
      Future = v;
    }

  }, 2);
  let postcss;
  module1.link("postcss", {
    default(v) {
      postcss = v;
    }

  }, 3);
  let cssnano;
  module1.link("cssnano", {
    default(v) {
      cssnano = v;
    }

  }, 4);
  const CssTools = {
    /**
     * Parse the incoming CSS string; return a CSS AST.
     *
     * @param {string} cssText The CSS string to be parsed.
     * @param {Object} options Options to pass to the PostCSS parser.
     * @return {postcss#Root} PostCSS Root AST.
     */
    parseCss(cssText) {
      let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      // This function previously used the `css-parse` npm package, which
      // set the name of the css file being parsed using  { source: 'filename' }.
      // If included, we'll convert this to the `postcss` equivalent, to maintain
      // backwards compatibility.
      if (options.source) {
        options.from = options.source;
        delete options.source;
      }

      return postcss.parse(cssText, options);
    },

    /**
     * Using the incoming CSS AST, create and return a new object with the
     * generated CSS string, and optional sourcemap details.
     *
     * @param {postcss#Root} cssAst PostCSS Root AST.
     * @param {Object} options Options to pass to the PostCSS parser.
     * @return {Object} Format: { code: 'css string', map: 'sourcemap deatils' }.
     */
    stringifyCss(cssAst) {
      let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      // This function previously used the `css-stringify` npm package, which
      // controlled sourcemap generation by passing in { sourcemap: true }.
      // If included, we'll convert this to the `postcss` equivalent, to maintain
      // backwards compatibility.
      if (options.sourcemap) {
        options.map = {
          inline: false,
          annotation: false,
          sourcesContent: false
        };
        delete options.sourcemap;
      } // explicitly set from to undefined to prevent postcss warnings


      if (!options.from) {
        options.from = void 0;
      }

      transformResult = cssAst.toResult(options);
      return {
        code: transformResult.css,
        map: transformResult.map ? transformResult.map.toJSON() : null
      };
    },

    /**
     * Minify the passed in CSS string.
     *
     * @param {string} cssText CSS string to minify.
     * @return {String[]} Array containing the minified CSS.
     */
    minifyCss(cssText) {
      const f = new Future();
      postcss([cssnano({
        safe: true
      })]).process(cssText, {
        from: void 0
      }).then(result => {
        f.return(result.css);
      }).catch(error => {
        f.throw(error);
      });
      const minifiedCss = f.wait(); // Since this function has always returned an array, we'll wrap the
      // minified css string in an array before returning, even though we're
      // only ever returning one minified css string in that array (maintaining
      // backwards compatibility).

      return [minifiedCss];
    },

    /**
     * Merge multiple CSS AST's into one.
     *
     * @param {postcss#Root[]} cssAsts Array of PostCSS Root objects.
     * @callback warnCb Callback used to handle warning messages.
     * @return {postcss#Root} PostCSS Root object.
     */
    mergeCssAsts(cssAsts, warnCb) {
      const rulesPredicate = function (rules) {
        let exclude = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        if (!Array.isArray(rules)) {
          rules = [rules];
        }

        return node => {
          // PostCSS AtRule nodes have `type: 'atrule'` and a descriptive name,
          // e.g. 'import' or 'charset', while Comment nodes have type only.
          const nodeMatchesRule = rules.includes(node.name || node.type);
          return exclude ? !nodeMatchesRule : nodeMatchesRule;
        };
      }; // Simple concatenation of CSS files would break @import rules
      // located in the beginning of a file. Before concatenation, pull
      // @import rules to the beginning of a new syntax tree so they always
      // precede other rules.


      const newAst = postcss.root();
      cssAsts.forEach(ast => {
        if (ast.nodes) {
          // Pick only the imports from the beginning of file ignoring @charset
          // rules as every file is assumed to be in UTF-8.
          const charsetRules = ast.nodes.filter(rulesPredicate('charset'));

          if (charsetRules.some(rule => {
            // According to MDN, only 'UTF-8' and "UTF-8" are the correct
            // encoding directives representing UTF-8.
            return !/^(['"])UTF-8\1$/.test(rule.params);
          })) {
            warnCb(ast.filename, '@charset rules in this file will be ignored as UTF-8 is the ' + 'only encoding supported');
          }

          ast.nodes = ast.nodes.filter(rulesPredicate('charset', true));
          let importCount = 0;

          for (let i = 0; i < ast.nodes.length; i++) {
            if (!rulesPredicate(['import', 'comment'])(ast.nodes[i])) {
              importCount = i;
              break;
            }
          }

          CssTools.rewriteCssUrls(ast);
          const imports = ast.nodes.splice(0, importCount);
          newAst.nodes.push(...imports); // If there are imports left in the middle of a file, warn users as it
          // might be a potential bug (imports are only valid at the beginning of
          // a file).

          if (ast.nodes.some(rulesPredicate('import'))) {
            warnCb(ast.filename, 'There are some @import rules in the middle of a file. This ' + 'might be a bug, as imports are only valid at the beginning of ' + 'a file.');
          }
        }
      }); // Now we can put the rest of CSS rules into new AST.

      cssAsts.forEach(ast => {
        if (ast.nodes) {
          newAst.nodes.push(...ast.nodes);
        }
      });
      return newAst;
    },

    /**
     * We are looking for all relative urls defined with the `url()` functional
     * notation and rewriting them to the equivalent absolute url using the
     * `source` path provided by postcss. For performance reasons this function
     * acts by side effect by modifying the given AST without doing a deep copy.
     *
     * @param {postcss#Root} ast PostCSS Root object.
     * @return Modifies the ast param in place.
     */
    rewriteCssUrls(ast) {
      const mergedCssPath = '/';
      rewriteRules(ast.nodes, mergedCssPath);
    }

  };

  if (typeof Profile !== 'undefined') {
    ['parseCss', 'stringifyCss', 'minifyCss', 'mergeCssAsts', 'rewriteCssUrls'].forEach(funcName => {
      CssTools[funcName] = Profile("CssTools.".concat(funcName), CssTools[funcName]);
    });
  }

  const hasOwn = Object.prototype.hasOwnProperty;

  const rewriteRules = (rules, mergedCssPath) => {
    rules.forEach(rule => {
      // Recurse if there are sub-rules. An example:
      //     @media (...) {
      //         .rule { url(...); }
      //     }
      if (hasOwn.call(rule, 'nodes')) {
        rewriteRules(rule.nodes, mergedCssPath);
      }

      const appDir = process.cwd();
      const sourceFile = rule.source.input.file;
      const sourceFileFromAppRoot = sourceFile ? sourceFile.replace(appDir, '') : '';
      let basePath = pathJoin('/', pathDirname(sourceFileFromAppRoot)); // Set the correct basePath based on how the linked asset will be served.
      // XXX This is wrong. We are coupling the information about how files will
      // be served by the web server to the information how they were stored
      // originally on the filesystem in the project structure. Ideally, there
      // should be some module that tells us precisely how each asset will be
      // served but for now we are just assuming that everything that comes from
      // a folder starting with "/packages/" is served on the same path as
      // it was on the filesystem and everything else is served on root "/".

      if (!basePath.match(/^\/?packages\//i)) {
        basePath = "/";
      }

      let value = rule.value; // Match css values containing some functional calls to `url(URI)` where
      // URI is optionally quoted.
      // Note that a css value can contains other elements, for instance:
      //   background: top center url("background.png") black;
      // or even multiple url(), for instance for multiple backgrounds.

      var cssUrlRegex = /url\s*\(\s*(['"]?)(.+?)\1\s*\)/gi;
      let parts;

      while (parts = cssUrlRegex.exec(value)) {
        const oldCssUrl = parts[0];
        const quote = parts[1];
        const resource = url.parse(parts[2]); // We don't rewrite URLs starting with a protocol definition such as
        // http, https, or data, or those with network-path references
        // i.e. //img.domain.com/cat.gif

        if (resource.protocol !== null || resource.href.startsWith('//') || resource.href.startsWith('#')) {
          continue;
        } // Rewrite relative paths (that refers to the internal application tree)
        // to absolute paths (addressable from the public build).


        let absolutePath = isRelative(resource.path) ? pathJoin(basePath, resource.path) : resource.path;

        if (resource.hash) {
          absolutePath += resource.hash;
        } // We used to finish the rewriting process at the absolute path step
        // above. But it didn't work in case the Meteor application was deployed
        // under a sub-path (eg `ROOT_URL=http://localhost:3000/myapp meteor`)
        // in which case the resources linked in the merged CSS file would miss
        // the `myapp/` prefix. Since this path prefix is only known at launch
        // time (rather than build time) we can't use absolute paths to link
        // resources in the generated CSS.
        //
        // Instead we transform absolute paths to make them relative to the
        // merged CSS, leaving to the browser the responsibility to calculate
        // the final resource links (by adding the application deployment
        // prefix, here `myapp/`, if applicable).


        const relativeToMergedCss = pathRelative(mergedCssPath, absolutePath);
        const newCssUrl = "url(".concat(quote).concat(relativeToMergedCss).concat(quote, ")");
        value = value.replace(oldCssUrl, newCssUrl);
      }

      rule.value = value;
    });
  };

  const isRelative = path => path && path.charAt(0) !== '/'; // These are duplicates of functions in tools/files.js, because we don't have
  // a good way of exporting them into packages.
  // XXX deduplicate files.js into a package at some point so that we can use it
  // in core


  const toOSPath = p => process.platform === 'win32' ? p.replace(/\//g, '\\') : p;

  const toStandardPath = p => process.platform === 'win32' ? p.replace(/\\/g, '/') : p;

  const pathJoin = (a, b) => toStandardPath(path.join(toOSPath(a), toOSPath(b)));

  const pathDirname = p => toStandardPath(path.dirname(toOSPath(p)));

  const pathRelative = (p1, p2) => toStandardPath(path.relative(toOSPath(p1), toOSPath(p2)));
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"postcss":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// node_modules/meteor/minifier-css/node_modules/postcss/package.json                                              //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
module.exports = {
  "name": "postcss",
  "version": "8.3.5",
  "main": "./lib/postcss.js"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"postcss.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// node_modules/meteor/minifier-css/node_modules/postcss/lib/postcss.js                                            //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"cssnano":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// node_modules/meteor/minifier-css/node_modules/cssnano/package.json                                              //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
module.exports = {
  "name": "cssnano",
  "version": "4.1.11",
  "main": "dist/index.js"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// node_modules/meteor/minifier-css/node_modules/cssnano/dist/index.js                                             //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/minifier-css/minifier.js");

/* Exports */
Package._define("minifier-css", exports, {
  CssTools: CssTools
});

})();

//# sourceURL=meteor://💻app/packages/minifier-css.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbWluaWZpZXItY3NzL21pbmlmaWVyLmpzIl0sIm5hbWVzIjpbIm1vZHVsZTEiLCJleHBvcnQiLCJDc3NUb29scyIsInBhdGgiLCJsaW5rIiwiZGVmYXVsdCIsInYiLCJ1cmwiLCJGdXR1cmUiLCJwb3N0Y3NzIiwiY3NzbmFubyIsInBhcnNlQ3NzIiwiY3NzVGV4dCIsIm9wdGlvbnMiLCJzb3VyY2UiLCJmcm9tIiwicGFyc2UiLCJzdHJpbmdpZnlDc3MiLCJjc3NBc3QiLCJzb3VyY2VtYXAiLCJtYXAiLCJpbmxpbmUiLCJhbm5vdGF0aW9uIiwic291cmNlc0NvbnRlbnQiLCJ0cmFuc2Zvcm1SZXN1bHQiLCJ0b1Jlc3VsdCIsImNvZGUiLCJjc3MiLCJ0b0pTT04iLCJtaW5pZnlDc3MiLCJmIiwic2FmZSIsInByb2Nlc3MiLCJ0aGVuIiwicmVzdWx0IiwicmV0dXJuIiwiY2F0Y2giLCJlcnJvciIsInRocm93IiwibWluaWZpZWRDc3MiLCJ3YWl0IiwibWVyZ2VDc3NBc3RzIiwiY3NzQXN0cyIsIndhcm5DYiIsInJ1bGVzUHJlZGljYXRlIiwicnVsZXMiLCJleGNsdWRlIiwiQXJyYXkiLCJpc0FycmF5Iiwibm9kZSIsIm5vZGVNYXRjaGVzUnVsZSIsImluY2x1ZGVzIiwibmFtZSIsInR5cGUiLCJuZXdBc3QiLCJyb290IiwiZm9yRWFjaCIsImFzdCIsIm5vZGVzIiwiY2hhcnNldFJ1bGVzIiwiZmlsdGVyIiwic29tZSIsInJ1bGUiLCJ0ZXN0IiwicGFyYW1zIiwiZmlsZW5hbWUiLCJpbXBvcnRDb3VudCIsImkiLCJsZW5ndGgiLCJyZXdyaXRlQ3NzVXJscyIsImltcG9ydHMiLCJzcGxpY2UiLCJwdXNoIiwibWVyZ2VkQ3NzUGF0aCIsInJld3JpdGVSdWxlcyIsIlByb2ZpbGUiLCJmdW5jTmFtZSIsImhhc093biIsIk9iamVjdCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsImFwcERpciIsImN3ZCIsInNvdXJjZUZpbGUiLCJpbnB1dCIsImZpbGUiLCJzb3VyY2VGaWxlRnJvbUFwcFJvb3QiLCJyZXBsYWNlIiwiYmFzZVBhdGgiLCJwYXRoSm9pbiIsInBhdGhEaXJuYW1lIiwibWF0Y2giLCJ2YWx1ZSIsImNzc1VybFJlZ2V4IiwicGFydHMiLCJleGVjIiwib2xkQ3NzVXJsIiwicXVvdGUiLCJyZXNvdXJjZSIsInByb3RvY29sIiwiaHJlZiIsInN0YXJ0c1dpdGgiLCJhYnNvbHV0ZVBhdGgiLCJpc1JlbGF0aXZlIiwiaGFzaCIsInJlbGF0aXZlVG9NZXJnZWRDc3MiLCJwYXRoUmVsYXRpdmUiLCJuZXdDc3NVcmwiLCJjaGFyQXQiLCJ0b09TUGF0aCIsInAiLCJwbGF0Zm9ybSIsInRvU3RhbmRhcmRQYXRoIiwiYSIsImIiLCJqb2luIiwiZGlybmFtZSIsInAxIiwicDIiLCJyZWxhdGl2ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxTQUFPLENBQUNDLE1BQVIsQ0FBZTtBQUFDQyxZQUFRLEVBQUMsTUFBSUE7QUFBZCxHQUFmO0FBQXdDLE1BQUlDLElBQUo7QUFBU0gsU0FBTyxDQUFDSSxJQUFSLENBQWEsTUFBYixFQUFvQjtBQUFDQyxXQUFPLENBQUNDLENBQUQsRUFBRztBQUFDSCxVQUFJLEdBQUNHLENBQUw7QUFBTzs7QUFBbkIsR0FBcEIsRUFBeUMsQ0FBekM7QUFBNEMsTUFBSUMsR0FBSjtBQUFRUCxTQUFPLENBQUNJLElBQVIsQ0FBYSxLQUFiLEVBQW1CO0FBQUNDLFdBQU8sQ0FBQ0MsQ0FBRCxFQUFHO0FBQUNDLFNBQUcsR0FBQ0QsQ0FBSjtBQUFNOztBQUFsQixHQUFuQixFQUF1QyxDQUF2QztBQUEwQyxNQUFJRSxNQUFKO0FBQVdSLFNBQU8sQ0FBQ0ksSUFBUixDQUFhLGVBQWIsRUFBNkI7QUFBQ0MsV0FBTyxDQUFDQyxDQUFELEVBQUc7QUFBQ0UsWUFBTSxHQUFDRixDQUFQO0FBQVM7O0FBQXJCLEdBQTdCLEVBQW9ELENBQXBEO0FBQXVELE1BQUlHLE9B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Q0FBQ3FILFFBQUwsQ0FBY1YsUUFBUSxDQUFDUSxFQUFELENBQXRCLEVBQTRCUixRQUFRLENBQUNTLEVBQUQsQ0FBcEMsQ0FBRCxDQUQ1QiIsImZpbGUiOiIvcGFja2FnZXMvbWluaWZpZXItY3NzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdXJsIGZyb20gJ3VybCc7XG5pbXBvcnQgRnV0dXJlIGZyb20gJ2ZpYmVycy9mdXR1cmUnO1xuaW1wb3J0IHBvc3Rjc3MgZnJvbSAncG9zdGNzcyc7XG5pbXBvcnQgY3NzbmFubyBmcm9tICdjc3NuYW5vJztcblxuY29uc3QgQ3NzVG9vbHMgPSB7XG4gIC8qKlxuICAgKiBQYXJzZSB0aGUgaW5jb21pbmcgQ1NTIHN0cmluZzsgcmV0dXJuIGEgQ1NTIEFTVC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNzc1RleHQgVGhlIENTUyBzdHJpbmcgdG8gYmUgcGFyc2VkLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPcHRpb25zIHRvIHBhc3MgdG8gdGhlIFBvc3RDU1MgcGFyc2VyLlxuICAgKiBAcmV0dXJuIHtwb3N0Y3NzI1Jvb3R9IFBvc3RDU1MgUm9vdCBBU1QuXG4gICAqL1xuICBwYXJzZUNzcyhjc3NUZXh0LCBvcHRpb25zID0ge30pIHtcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHByZXZpb3VzbHkgdXNlZCB0aGUgYGNzcy1wYXJzZWAgbnBtIHBhY2thZ2UsIHdoaWNoXG4gICAgLy8gc2V0IHRoZSBuYW1lIG9mIHRoZSBjc3MgZmlsZSBiZWluZyBwYXJzZWQgdXNpbmcgIHsgc291cmNlOiAnZmlsZW5hbWUnIH0uXG4gICAgLy8gSWYgaW5jbHVkZWQsIHdlJ2xsIGNvbnZlcnQgdGhpcyB0byB0aGUgYHBvc3Rjc3NgIGVxdWl2YWxlbnQsIHRvIG1haW50YWluXG4gICAgLy8gYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG4gICAgaWYgKG9wdGlvbnMuc291cmNlKSB7XG4gICAgICBvcHRpb25zLmZyb20gPSBvcHRpb25zLnNvdXJjZTtcbiAgICAgIGRlbGV0ZSBvcHRpb25zLnNvdXJjZTtcbiAgICB9XG4gICAgcmV0dXJuIHBvc3Rjc3MucGFyc2UoY3NzVGV4dCwgb3B0aW9ucyk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFVzaW5nIHRoZSBpbmNvbWluZyBDU1MgQVNULCBjcmVhdGUgYW5kIHJldHVybiBhIG5ldyBvYmplY3Qgd2l0aCB0aGVcbiAgICogZ2VuZXJhdGVkIENTUyBzdHJpbmcsIGFuZCBvcHRpb25hbCBzb3VyY2VtYXAgZGV0YWlscy5cbiAgICpcbiAgICogQHBhcmFtIHtwb3N0Y3NzI1Jvb3R9IGNzc0FzdCBQb3N0Q1NTIFJvb3QgQVNULlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPcHRpb25zIHRvIHBhc3MgdG8gdGhlIFBvc3RDU1MgcGFyc2VyLlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEZvcm1hdDogeyBjb2RlOiAnY3NzIHN0cmluZycsIG1hcDogJ3NvdXJjZW1hcCBkZWF0aWxzJyB9LlxuICAgKi9cbiAgc3RyaW5naWZ5Q3NzKGNzc0FzdCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgLy8gVGhpcyBmdW5jdGlvbiBwcmV2aW91c2x5IHVzZWQgdGhlIGBjc3Mtc3RyaW5naWZ5YCBucG0gcGFja2FnZSwgd2hpY2hcbiAgICAvLyBjb250cm9sbGVkIHNvdXJjZW1hcCBnZW5lcmF0aW9uIGJ5IHBhc3NpbmcgaW4geyBzb3VyY2VtYXA6IHRydWUgfS5cbiAgICAvLyBJZiBpbmNsdWRlZCwgd2UnbGwgY29udmVydCB0aGlzIHRvIHRoZSBgcG9zdGNzc2AgZXF1aXZhbGVudCwgdG8gbWFpbnRhaW5cbiAgICAvLyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbiAgICBpZiAob3B0aW9ucy5zb3VyY2VtYXApIHtcbiAgICAgIG9wdGlvbnMubWFwID0ge1xuICAgICAgICBpbmxpbmU6IGZhbHNlLFxuICAgICAgICBhbm5vdGF0aW9uOiBmYWxzZSxcbiAgICAgICAgc291cmNlc0NvbnRlbnQ6IGZhbHNlLFxuICAgICAgfTtcbiAgICAgIGRlbGV0ZSBvcHRpb25zLnNvdXJjZW1hcDtcbiAgICB9XG4gICAgLy8gZXhwbGljaXRseSBzZXQgZnJvbSB0byB1bmRlZmluZWQgdG8gcHJldmVudCBwb3N0Y3NzIHdhcm5pbmdzXG4gICAgaWYgKCFvcHRpb25zLmZyb20pe1xuICAgICAgb3B0aW9ucy5mcm9tID0gdm9pZCAwO1xuICAgIH1cblxuICAgIHRyYW5zZm9ybVJlc3VsdCA9IGNzc0FzdC50b1Jlc3VsdChvcHRpb25zKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiB0cmFuc2Zvcm1SZXN1bHQuY3NzLFxuICAgICAgbWFwOiB0cmFuc2Zvcm1SZXN1bHQubWFwID8gdHJhbnNmb3JtUmVzdWx0Lm1hcC50b0pTT04oKSA6IG51bGwsXG4gICAgfTtcbiAgfSxcblxuICAvKipcbiAgICogTWluaWZ5IHRoZSBwYXNzZWQgaW4gQ1NTIHN0cmluZy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNzc1RleHQgQ1NTIHN0cmluZyB0byBtaW5pZnkuXG4gICAqIEByZXR1cm4ge1N0cmluZ1tdfSBBcnJheSBjb250YWluaW5nIHRoZSBtaW5pZmllZCBDU1MuXG4gICAqL1xuICBtaW5pZnlDc3MoY3NzVGV4dCkge1xuICAgIGNvbnN0IGYgPSBuZXcgRnV0dXJlO1xuICAgIHBvc3Rjc3MoW1xuICAgICAgY3NzbmFubyh7IHNhZmU6IHRydWUgfSksXG4gICAgXSkucHJvY2Vzcyhjc3NUZXh0LCB7XG4gICAgICBmcm9tOiB2b2lkIDAsXG4gICAgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgZi5yZXR1cm4ocmVzdWx0LmNzcyk7XG4gICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgZi50aHJvdyhlcnJvcik7XG4gICAgfSk7XG4gICAgY29uc3QgbWluaWZpZWRDc3MgPSBmLndhaXQoKTtcblxuICAgIC8vIFNpbmNlIHRoaXMgZnVuY3Rpb24gaGFzIGFsd2F5cyByZXR1cm5lZCBhbiBhcnJheSwgd2UnbGwgd3JhcCB0aGVcbiAgICAvLyBtaW5pZmllZCBjc3Mgc3RyaW5nIGluIGFuIGFycmF5IGJlZm9yZSByZXR1cm5pbmcsIGV2ZW4gdGhvdWdoIHdlJ3JlXG4gICAgLy8gb25seSBldmVyIHJldHVybmluZyBvbmUgbWluaWZpZWQgY3NzIHN0cmluZyBpbiB0aGF0IGFycmF5IChtYWludGFpbmluZ1xuICAgIC8vIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5KS5cbiAgICByZXR1cm4gW21pbmlmaWVkQ3NzXTtcbiAgfSxcblxuICAvKipcbiAgICogTWVyZ2UgbXVsdGlwbGUgQ1NTIEFTVCdzIGludG8gb25lLlxuICAgKlxuICAgKiBAcGFyYW0ge3Bvc3Rjc3MjUm9vdFtdfSBjc3NBc3RzIEFycmF5IG9mIFBvc3RDU1MgUm9vdCBvYmplY3RzLlxuICAgKiBAY2FsbGJhY2sgd2FybkNiIENhbGxiYWNrIHVzZWQgdG8gaGFuZGxlIHdhcm5pbmcgbWVzc2FnZXMuXG4gICAqIEByZXR1cm4ge3Bvc3Rjc3MjUm9vdH0gUG9zdENTUyBSb290IG9iamVjdC5cbiAgICovXG4gIG1lcmdlQ3NzQXN0cyhjc3NBc3RzLCB3YXJuQ2IpIHtcbiAgICBjb25zdCBydWxlc1ByZWRpY2F0ZSA9IChydWxlcywgZXhjbHVkZSA9IGZhbHNlKSA9PiB7XG4gICAgICBpZiAoISBBcnJheS5pc0FycmF5KHJ1bGVzKSkge1xuICAgICAgICBydWxlcyA9IFtydWxlc107XG4gICAgICB9XG4gICAgICByZXR1cm4gbm9kZSA9PiB7XG4gICAgICAgIC8vIFBvc3RDU1MgQXRSdWxlIG5vZGVzIGhhdmUgYHR5cGU6ICdhdHJ1bGUnYCBhbmQgYSBkZXNjcmlwdGl2ZSBuYW1lLFxuICAgICAgICAvLyBlLmcuICdpbXBvcnQnIG9yICdjaGFyc2V0Jywgd2hpbGUgQ29tbWVudCBub2RlcyBoYXZlIHR5cGUgb25seS5cbiAgICAgICAgY29uc3Qgbm9kZU1hdGNoZXNSdWxlID0gcnVsZXMuaW5jbHVkZXMobm9kZS5uYW1lIHx8IG5vZGUudHlwZSk7XG5cbiAgICAgICAgcmV0dXJuIGV4Y2x1ZGUgPyAhbm9kZU1hdGNoZXNSdWxlIDogbm9kZU1hdGNoZXNSdWxlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBTaW1wbGUgY29uY2F0ZW5hdGlvbiBvZiBDU1MgZmlsZXMgd291bGQgYnJlYWsgQGltcG9ydCBydWxlc1xuICAgIC8vIGxvY2F0ZWQgaW4gdGhlIGJlZ2lubmluZyBvZiBhIGZpbGUuIEJlZm9yZSBjb25jYXRlbmF0aW9uLCBwdWxsXG4gICAgLy8gQGltcG9ydCBydWxlcyB0byB0aGUgYmVnaW5uaW5nIG9mIGEgbmV3IHN5bnRheCB0cmVlIHNvIHRoZXkgYWx3YXlzXG4gICAgLy8gcHJlY2VkZSBvdGhlciBydWxlcy5cbiAgICBjb25zdCBuZXdBc3QgPSBwb3N0Y3NzLnJvb3QoKTtcblxuICAgIGNzc0FzdHMuZm9yRWFjaCgoYXN0KSA9PiB7XG4gICAgICBpZiAoYXN0Lm5vZGVzKSB7XG4gICAgICAgIC8vIFBpY2sgb25seSB0aGUgaW1wb3J0cyBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgZmlsZSBpZ25vcmluZyBAY2hhcnNldFxuICAgICAgICAvLyBydWxlcyBhcyBldmVyeSBmaWxlIGlzIGFzc3VtZWQgdG8gYmUgaW4gVVRGLTguXG4gICAgICAgIGNvbnN0IGNoYXJzZXRSdWxlcyA9IGFzdC5ub2Rlcy5maWx0ZXIocnVsZXNQcmVkaWNhdGUoJ2NoYXJzZXQnKSk7XG5cbiAgICAgICAgaWYgKGNoYXJzZXRSdWxlcy5zb21lKChydWxlKSA9PiB7XG4gICAgICAgICAgLy8gQWNjb3JkaW5nIHRvIE1ETiwgb25seSAnVVRGLTgnIGFuZCBcIlVURi04XCIgYXJlIHRoZSBjb3JyZWN0XG4gICAgICAgICAgLy8gZW5jb2RpbmcgZGlyZWN0aXZlcyByZXByZXNlbnRpbmcgVVRGLTguXG4gICAgICAgICAgcmV0dXJuICEgL14oWydcIl0pVVRGLThcXDEkLy50ZXN0KHJ1bGUucGFyYW1zKTtcbiAgICAgICAgfSkpIHtcbiAgICAgICAgICB3YXJuQ2IoXG4gICAgICAgICAgICBhc3QuZmlsZW5hbWUsXG4gICAgICAgICAgICAnQGNoYXJzZXQgcnVsZXMgaW4gdGhpcyBmaWxlIHdpbGwgYmUgaWdub3JlZCBhcyBVVEYtOCBpcyB0aGUgJyArXG4gICAgICAgICAgICAnb25seSBlbmNvZGluZyBzdXBwb3J0ZWQnXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFzdC5ub2RlcyA9IGFzdC5ub2Rlcy5maWx0ZXIocnVsZXNQcmVkaWNhdGUoJ2NoYXJzZXQnLCB0cnVlKSk7XG4gICAgICAgIGxldCBpbXBvcnRDb3VudCA9IDA7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXN0Lm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKCEgcnVsZXNQcmVkaWNhdGUoWydpbXBvcnQnLCAnY29tbWVudCddKShhc3Qubm9kZXNbaV0pKSB7XG4gICAgICAgICAgICBpbXBvcnRDb3VudCA9IGk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBDc3NUb29scy5yZXdyaXRlQ3NzVXJscyhhc3QpO1xuXG4gICAgICAgIGNvbnN0IGltcG9ydHMgPSBhc3Qubm9kZXMuc3BsaWNlKDAsIGltcG9ydENvdW50KTtcbiAgICAgICAgbmV3QXN0Lm5vZGVzLnB1c2goLi4uaW1wb3J0cyk7XG5cbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIGltcG9ydHMgbGVmdCBpbiB0aGUgbWlkZGxlIG9mIGEgZmlsZSwgd2FybiB1c2VycyBhcyBpdFxuICAgICAgICAvLyBtaWdodCBiZSBhIHBvdGVudGlhbCBidWcgKGltcG9ydHMgYXJlIG9ubHkgdmFsaWQgYXQgdGhlIGJlZ2lubmluZyBvZlxuICAgICAgICAvLyBhIGZpbGUpLlxuICAgICAgICBpZiAoYXN0Lm5vZGVzLnNvbWUocnVsZXNQcmVkaWNhdGUoJ2ltcG9ydCcpKSkge1xuICAgICAgICAgIHdhcm5DYihcbiAgICAgICAgICAgIGFzdC5maWxlbmFtZSxcbiAgICAgICAgICAgICdUaGVyZSBhcmUgc29tZSBAaW1wb3J0IHJ1bGVzIGluIHRoZSBtaWRkbGUgb2YgYSBmaWxlLiBUaGlzICcgK1xuICAgICAgICAgICAgJ21pZ2h0IGJlIGEgYnVnLCBhcyBpbXBvcnRzIGFyZSBvbmx5IHZhbGlkIGF0IHRoZSBiZWdpbm5pbmcgb2YgJyArXG4gICAgICAgICAgICAnYSBmaWxlLidcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBOb3cgd2UgY2FuIHB1dCB0aGUgcmVzdCBvZiBDU1MgcnVsZXMgaW50byBuZXcgQVNULlxuICAgIGNzc0FzdHMuZm9yRWFjaCgoYXN0KSA9PiB7XG4gICAgICBpZiAoYXN0Lm5vZGVzKSB7XG4gICAgICAgIG5ld0FzdC5ub2Rlcy5wdXNoKC4uLmFzdC5ub2Rlcyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3QXN0O1xuICB9LFxuXG4gIC8qKlxuICAgKiBXZSBhcmUgbG9va2luZyBmb3IgYWxsIHJlbGF0aXZlIHVybHMgZGVmaW5lZCB3aXRoIHRoZSBgdXJsKClgIGZ1bmN0aW9uYWxcbiAgICogbm90YXRpb24gYW5kIHJld3JpdGluZyB0aGVtIHRvIHRoZSBlcXVpdmFsZW50IGFic29sdXRlIHVybCB1c2luZyB0aGVcbiAgICogYHNvdXJjZWAgcGF0aCBwcm92aWRlZCBieSBwb3N0Y3NzLiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyB0aGlzIGZ1bmN0aW9uXG4gICAqIGFjdHMgYnkgc2lkZSBlZmZlY3QgYnkgbW9kaWZ5aW5nIHRoZSBnaXZlbiBBU1Qgd2l0aG91dCBkb2luZyBhIGRlZXAgY29weS5cbiAgICpcbiAgICogQHBhcmFtIHtwb3N0Y3NzI1Jvb3R9IGFzdCBQb3N0Q1NTIFJvb3Qgb2JqZWN0LlxuICAgKiBAcmV0dXJuIE1vZGlmaWVzIHRoZSBhc3QgcGFyYW0gaW4gcGxhY2UuXG4gICAqL1xuICByZXdyaXRlQ3NzVXJscyhhc3QpIHtcbiAgICBjb25zdCBtZXJnZWRDc3NQYXRoID0gJy8nO1xuICAgIHJld3JpdGVSdWxlcyhhc3Qubm9kZXMsIG1lcmdlZENzc1BhdGgpO1xuICB9XG59O1xuXG5pZiAodHlwZW9mIFByb2ZpbGUgIT09ICd1bmRlZmluZWQnKSB7XG4gIFtcbiAgICAncGFyc2VDc3MnLFxuICAgICdzdHJpbmdpZnlDc3MnLFxuICAgICdtaW5pZnlDc3MnLFxuICAgICdtZXJnZUNzc0FzdHMnLFxuICAgICdyZXdyaXRlQ3NzVXJscycsXG4gIF0uZm9yRWFjaChmdW5jTmFtZSA9PiB7XG4gICAgQ3NzVG9vbHNbZnVuY05hbWVdID0gUHJvZmlsZShgQ3NzVG9vbHMuJHtmdW5jTmFtZX1gLCBDc3NUb29sc1tmdW5jTmFtZV0pO1xuICB9KTtcbn1cblxuZXhwb3J0IHsgQ3NzVG9vbHMgfTtcblxuY29uc3QgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuY29uc3QgcmV3cml0ZVJ1bGVzID0gKHJ1bGVzLCBtZXJnZWRDc3NQYXRoKSA9PiB7XG4gIHJ1bGVzLmZvckVhY2goKHJ1bGUpID0+IHtcbiAgICAvLyBSZWN1cnNlIGlmIHRoZXJlIGFyZSBzdWItcnVsZXMuIEFuIGV4YW1wbGU6XG4gICAgLy8gICAgIEBtZWRpYSAoLi4uKSB7XG4gICAgLy8gICAgICAgICAucnVsZSB7IHVybCguLi4pOyB9XG4gICAgLy8gICAgIH1cbiAgICBpZiAoaGFzT3duLmNhbGwocnVsZSwgJ25vZGVzJykpIHtcbiAgICAgIHJld3JpdGVSdWxlcyhydWxlLm5vZGVzLCBtZXJnZWRDc3NQYXRoKTtcbiAgICB9XG5cbiAgICBjb25zdCBhcHBEaXIgPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBydWxlLnNvdXJjZS5pbnB1dC5maWxlO1xuICAgIGNvbnN0IHNvdXJjZUZpbGVGcm9tQXBwUm9vdCA9XG4gICAgICBzb3VyY2VGaWxlID8gc291cmNlRmlsZS5yZXBsYWNlKGFwcERpciwgJycpIDogJyc7XG4gICAgbGV0IGJhc2VQYXRoID0gcGF0aEpvaW4oJy8nLCBwYXRoRGlybmFtZShzb3VyY2VGaWxlRnJvbUFwcFJvb3QpKTtcblxuICAgIC8vIFNldCB0aGUgY29ycmVjdCBiYXNlUGF0aCBiYXNlZCBvbiBob3cgdGhlIGxpbmtlZCBhc3NldCB3aWxsIGJlIHNlcnZlZC5cbiAgICAvLyBYWFggVGhpcyBpcyB3cm9uZy4gV2UgYXJlIGNvdXBsaW5nIHRoZSBpbmZvcm1hdGlvbiBhYm91dCBob3cgZmlsZXMgd2lsbFxuICAgIC8vIGJlIHNlcnZlZCBieSB0aGUgd2ViIHNlcnZlciB0byB0aGUgaW5mb3JtYXRpb24gaG93IHRoZXkgd2VyZSBzdG9yZWRcbiAgICAvLyBvcmlnaW5hbGx5IG9uIHRoZSBmaWxlc3lzdGVtIGluIHRoZSBwcm9qZWN0IHN0cnVjdHVyZS4gSWRlYWxseSwgdGhlcmVcbiAgICAvLyBzaG91bGQgYmUgc29tZSBtb2R1bGUgdGhhdCB0ZWxscyB1cyBwcmVjaXNlbHkgaG93IGVhY2ggYXNzZXQgd2lsbCBiZVxuICAgIC8vIHNlcnZlZCBidXQgZm9yIG5vdyB3ZSBhcmUganVzdCBhc3N1bWluZyB0aGF0IGV2ZXJ5dGhpbmcgdGhhdCBjb21lcyBmcm9tXG4gICAgLy8gYSBmb2xkZXIgc3RhcnRpbmcgd2l0aCBcIi9wYWNrYWdlcy9cIiBpcyBzZXJ2ZWQgb24gdGhlIHNhbWUgcGF0aCBhc1xuICAgIC8vIGl0IHdhcyBvbiB0aGUgZmlsZXN5c3RlbSBhbmQgZXZlcnl0aGluZyBlbHNlIGlzIHNlcnZlZCBvbiByb290IFwiL1wiLlxuICAgIGlmICghIGJhc2VQYXRoLm1hdGNoKC9eXFwvP3BhY2thZ2VzXFwvL2kpKSB7XG4gICAgICBiYXNlUGF0aCA9IFwiL1wiO1xuICAgIH1cblxuICAgIGxldCB2YWx1ZSA9IHJ1bGUudmFsdWU7XG5cbiAgICAvLyBNYXRjaCBjc3MgdmFsdWVzIGNvbnRhaW5pbmcgc29tZSBmdW5jdGlvbmFsIGNhbGxzIHRvIGB1cmwoVVJJKWAgd2hlcmVcbiAgICAvLyBVUkkgaXMgb3B0aW9uYWxseSBxdW90ZWQuXG4gICAgLy8gTm90ZSB0aGF0IGEgY3NzIHZhbHVlIGNhbiBjb250YWlucyBvdGhlciBlbGVtZW50cywgZm9yIGluc3RhbmNlOlxuICAgIC8vICAgYmFja2dyb3VuZDogdG9wIGNlbnRlciB1cmwoXCJiYWNrZ3JvdW5kLnBuZ1wiKSBibGFjaztcbiAgICAvLyBvciBldmVuIG11bHRpcGxlIHVybCgpLCBmb3IgaW5zdGFuY2UgZm9yIG11bHRpcGxlIGJhY2tncm91bmRzLlxuICAgIHZhciBjc3NVcmxSZWdleCA9IC91cmxcXHMqXFwoXFxzKihbJ1wiXT8pKC4rPylcXDFcXHMqXFwpL2dpO1xuICAgIGxldCBwYXJ0cztcbiAgICB3aGlsZSAocGFydHMgPSBjc3NVcmxSZWdleC5leGVjKHZhbHVlKSkge1xuICAgICAgY29uc3Qgb2xkQ3NzVXJsID0gcGFydHNbMF07XG4gICAgICBjb25zdCBxdW90ZSA9IHBhcnRzWzFdO1xuICAgICAgY29uc3QgcmVzb3VyY2UgPSB1cmwucGFyc2UocGFydHNbMl0pO1xuXG4gICAgICAvLyBXZSBkb24ndCByZXdyaXRlIFVSTHMgc3RhcnRpbmcgd2l0aCBhIHByb3RvY29sIGRlZmluaXRpb24gc3VjaCBhc1xuICAgICAgLy8gaHR0cCwgaHR0cHMsIG9yIGRhdGEsIG9yIHRob3NlIHdpdGggbmV0d29yay1wYXRoIHJlZmVyZW5jZXNcbiAgICAgIC8vIGkuZS4gLy9pbWcuZG9tYWluLmNvbS9jYXQuZ2lmXG4gICAgICBpZiAocmVzb3VyY2UucHJvdG9jb2wgIT09IG51bGwgfHxcbiAgICAgICAgICByZXNvdXJjZS5ocmVmLnN0YXJ0c1dpdGgoJy8vJykgfHxcbiAgICAgICAgICByZXNvdXJjZS5ocmVmLnN0YXJ0c1dpdGgoJyMnKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gUmV3cml0ZSByZWxhdGl2ZSBwYXRocyAodGhhdCByZWZlcnMgdG8gdGhlIGludGVybmFsIGFwcGxpY2F0aW9uIHRyZWUpXG4gICAgICAvLyB0byBhYnNvbHV0ZSBwYXRocyAoYWRkcmVzc2FibGUgZnJvbSB0aGUgcHVibGljIGJ1aWxkKS5cbiAgICAgIGxldCBhYnNvbHV0ZVBhdGggPSBpc1JlbGF0aXZlKHJlc291cmNlLnBhdGgpXG4gICAgICAgID8gcGF0aEpvaW4oYmFzZVBhdGgsIHJlc291cmNlLnBhdGgpXG4gICAgICAgIDogcmVzb3VyY2UucGF0aDtcblxuICAgICAgaWYgKHJlc291cmNlLmhhc2gpIHtcbiAgICAgICAgYWJzb2x1dGVQYXRoICs9IHJlc291cmNlLmhhc2g7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIHVzZWQgdG8gZmluaXNoIHRoZSByZXdyaXRpbmcgcHJvY2VzcyBhdCB0aGUgYWJzb2x1dGUgcGF0aCBzdGVwXG4gICAgICAvLyBhYm92ZS4gQnV0IGl0IGRpZG4ndCB3b3JrIGluIGNhc2UgdGhlIE1ldGVvciBhcHBsaWNhdGlvbiB3YXMgZGVwbG95ZWRcbiAgICAgIC8vIHVuZGVyIGEgc3ViLXBhdGggKGVnIGBST09UX1VSTD1odHRwOi8vbG9jYWxob3N0OjMwMDAvbXlhcHAgbWV0ZW9yYClcbiAgICAgIC8vIGluIHdoaWNoIGNhc2UgdGhlIHJlc291cmNlcyBsaW5rZWQgaW4gdGhlIG1lcmdlZCBDU1MgZmlsZSB3b3VsZCBtaXNzXG4gICAgICAvLyB0aGUgYG15YXBwL2AgcHJlZml4LiBTaW5jZSB0aGlzIHBhdGggcHJlZml4IGlzIG9ubHkga25vd24gYXQgbGF1bmNoXG4gICAgICAvLyB0aW1lIChyYXRoZXIgdGhhbiBidWlsZCB0aW1lKSB3ZSBjYW4ndCB1c2UgYWJzb2x1dGUgcGF0aHMgdG8gbGlua1xuICAgICAgLy8gcmVzb3VyY2VzIGluIHRoZSBnZW5lcmF0ZWQgQ1NTLlxuICAgICAgLy9cbiAgICAgIC8vIEluc3RlYWQgd2UgdHJhbnNmb3JtIGFic29sdXRlIHBhdGhzIHRvIG1ha2UgdGhlbSByZWxhdGl2ZSB0byB0aGVcbiAgICAgIC8vIG1lcmdlZCBDU1MsIGxlYXZpbmcgdG8gdGhlIGJyb3dzZXIgdGhlIHJlc3BvbnNpYmlsaXR5IHRvIGNhbGN1bGF0ZVxuICAgICAgLy8gdGhlIGZpbmFsIHJlc291cmNlIGxpbmtzIChieSBhZGRpbmcgdGhlIGFwcGxpY2F0aW9uIGRlcGxveW1lbnRcbiAgICAgIC8vIHByZWZpeCwgaGVyZSBgbXlhcHAvYCwgaWYgYXBwbGljYWJsZSkuXG4gICAgICBjb25zdCByZWxhdGl2ZVRvTWVyZ2VkQ3NzID0gcGF0aFJlbGF0aXZlKG1lcmdlZENzc1BhdGgsIGFic29sdXRlUGF0aCk7XG4gICAgICBjb25zdCBuZXdDc3NVcmwgPSBgdXJsKCR7cXVvdGV9JHtyZWxhdGl2ZVRvTWVyZ2VkQ3NzfSR7cXVvdGV9KWA7XG4gICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2Uob2xkQ3NzVXJsLCBuZXdDc3NVcmwpO1xuICAgIH1cblxuICAgIHJ1bGUudmFsdWUgPSB2YWx1ZTtcbiAgfSk7XG59O1xuXG5jb25zdCBpc1JlbGF0aXZlID0gcGF0aCA9PiBwYXRoICYmIHBhdGguY2hhckF0KDApICE9PSAnLyc7XG5cbi8vIFRoZXNlIGFyZSBkdXBsaWNhdGVzIG9mIGZ1bmN0aW9ucyBpbiB0b29scy9maWxlcy5qcywgYmVjYXVzZSB3ZSBkb24ndCBoYXZlXG4vLyBhIGdvb2Qgd2F5IG9mIGV4cG9ydGluZyB0aGVtIGludG8gcGFja2FnZXMuXG4vLyBYWFggZGVkdXBsaWNhdGUgZmlsZXMuanMgaW50byBhIHBhY2thZ2UgYXQgc29tZSBwb2ludCBzbyB0aGF0IHdlIGNhbiB1c2UgaXRcbi8vIGluIGNvcmVcbmNvbnN0IHRvT1NQYXRoID1cbiAgcCA9PiBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInID8gcC5yZXBsYWNlKC9cXC8vZywgJ1xcXFwnKSA6IHA7XG5jb25zdCB0b1N0YW5kYXJkUGF0aCA9XG4gIHAgPT4gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJyA/IHAucmVwbGFjZSgvXFxcXC9nLCAnLycpIDogcDtcbmNvbnN0IHBhdGhKb2luID1cbiAgKGEsIGIpID0+IHRvU3RhbmRhcmRQYXRoKHBhdGguam9pbih0b09TUGF0aChhKSwgdG9PU1BhdGgoYikpKTtcbmNvbnN0IHBhdGhEaXJuYW1lID1cbiAgcCA9PiB0b1N0YW5kYXJkUGF0aChwYXRoLmRpcm5hbWUodG9PU1BhdGgocCkpKTtcbmNvbnN0IHBhdGhSZWxhdGl2ZSA9XG4gIChwMSwgcDIpID0+IHRvU3RhbmRhcmRQYXRoKHBhdGgucmVsYXRpdmUodG9PU1BhdGgocDEpLCB0b09TUGF0aChwMikpKTtcbiJdfQ==
