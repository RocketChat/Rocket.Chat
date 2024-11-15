Package["core-runtime"].queue("compileVersion",function () {/* Imports */
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"compileVersion":{"plugin":{"compile-version.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/compileVersion/plugin/compile-version.js                                                             //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reify_async_result__) {
  "use strict";
  try {
    let _asyncIterator;
    module.link("@babel/runtime/helpers/asyncIterator", {
      default(v) {
        _asyncIterator = v;
      }
    }, 0);
    let exec;
    module.link("child_process", {
      exec(v) {
        exec = v;
      }
    }, 0);
    let os;
    module.link("os", {
      default(v) {
        os = v;
      }
    }, 1);
    let util;
    module.link("util", {
      default(v) {
        util = v;
      }
    }, 2);
    let path;
    module.link("path", {
      default(v) {
        path = v;
      }
    }, 3);
    let fs;
    module.link("fs", {
      default(v) {
        fs = v;
      }
    }, 4);
    let https;
    module.link("https", {
      default(v) {
        https = v;
      }
    }, 5);
    if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();
    const execAsync = util.promisify(exec);
    class VersionCompiler {
      async processFilesForTarget(files) {
        const processVersionFile = async function (file) {
          const data = await new Promise((resolve, reject) => {
            var _JSON$parse;
            const currentVersion = ((_JSON$parse = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './package.json'), {
              encoding: 'utf8'
            }))) === null || _JSON$parse === void 0 ? void 0 : _JSON$parse.version) || '';
            const type = currentVersion.includes('-rc.') ? 'candidate' : currentVersion.includes('-develop') ? 'develop' : 'stable';
            const url = "https://releases.rocket.chat/v2/server/supportedVersions?includeDraftType=".concat(type, "&includeDraftTag=").concat(currentVersion);
            function handleError(err) {
              console.error(err);
              // TODO remove this when we are ready to fail
              if (process.env.NODE_ENV !== 'development') {
                reject(err);
                return;
              }
              resolve({});
            }
            https.get(url, function (response) {
              let data = '';
              response.on('data', function (chunk) {
                data += chunk;
              });
              response.on('end', async function () {
                const supportedVersions = JSON.parse(data);
                if (!(supportedVersions !== null && supportedVersions !== void 0 && supportedVersions.signed)) {
                  return handleError(new Error("Invalid supportedVersions result:\n  URL: ".concat(url, " \n  RESULT: ").concat(data)));
                }

                // check if timestamp is inside 1 hour within build
                if (Math.abs(new Date().getTime() - new Date(supportedVersions.timestamp).getTime()) > 1000 * 60 * 60) {
                  return handleError(new Error("Invalid supportedVersions timestamp:\n  URL: ".concat(url, " \n  RESULT: ").concat(data)));
                }
                var _iteratorAbruptCompletion2 = false;
                var _didIteratorError2 = false;
                var _iteratorError2;
                try {
                  for (var _iterator2 = _asyncIterator(supportedVersions.versions), _step2; _iteratorAbruptCompletion2 = !(_step2 = await _iterator2.next()).done; _iteratorAbruptCompletion2 = false) {
                    const version = _step2.value;
                    {
                      // check if expiration is after the first rocket.chat release
                      if (new Date(version.expiration) < new Date('2019-04-01T00:00:00.000Z')) {
                        return handleError(new Error("Invalid supportedVersions expiration:\n  URL: ".concat(url, " \n  RESULT: ").concat(data)));
                      }
                    }
                  }
                } catch (err) {
                  _didIteratorError2 = true;
                  _iteratorError2 = err;
                } finally {
                  try {
                    if (_iteratorAbruptCompletion2 && _iterator2.return != null) {
                      await _iterator2.return();
                    }
                  } finally {
                    if (_didIteratorError2) {
                      throw _iteratorError2;
                    }
                  }
                }
                resolve(supportedVersions);
              });
              response.on('error', function (err) {
                handleError(err);
              });
            }).end();
          });
          file.addJavaScript({
            data: "exports.supportedVersions = ".concat(JSON.stringify(data)),
            path: "".concat(file.getPathInPackage(), ".js")
          });
        };
        const processFile = async function (file) {
          var _JSON$parse2, _JSON$parse2$rocketch;
          let output = JSON.parse(file.getContentsAsString());
          output.build = {
            date: new Date().toISOString(),
            nodeVersion: process.version,
            arch: process.arch,
            platform: process.platform,
            osRelease: os.release(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            cpus: os.cpus().length
          };
          output.marketplaceApiVersion = require('@rocket.chat/apps-engine/package.json').version.replace(/^[^0-9]/g, '');
          const minimumClientVersions = ((_JSON$parse2 = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './package.json'), {
            encoding: 'utf8'
          }))) === null || _JSON$parse2 === void 0 ? void 0 : (_JSON$parse2$rocketch = _JSON$parse2.rocketchat) === null || _JSON$parse2$rocketch === void 0 ? void 0 : _JSON$parse2$rocketch.minimumClientVersions) || {};
          try {
            const result = await execAsync("git log --pretty=format:'%H%n%ad%n%an%n%s' -n 1");
            const data = result.stdout.split('\n');
            output.commit = {
              hash: data.shift(),
              date: data.shift(),
              author: data.shift(),
              subject: data.join('\n')
            };
          } catch (e) {
            if (process.env.NODE_ENV !== 'development') {
              throw e;
            }
            // no git
          }
          try {
            const tags = await execAsync('git describe --abbrev=0 --tags');
            if (output.commit) {
              output.commit.tag = tags.stdout.replace('\n', '');
            }
          } catch (e) {
            // no tags
          }
          try {
            const branch = await execAsync('git rev-parse --abbrev-ref HEAD');
            if (output.commit) {
              output.commit.branch = branch.stdout.replace('\n', '');
            }
          } catch (e) {
            if (process.env.NODE_ENV !== 'development') {
              throw e;
            }

            // no branch
          }
          file.addJavaScript({
            data: "exports.Info = ".concat(JSON.stringify(output, null, 4), ";\n\t\t\t\texports.minimumClientVersions = ").concat(JSON.stringify(minimumClientVersions, null, 4), ";"),
            path: "".concat(file.getPathInPackage(), ".js")
          });
        };
        var _iteratorAbruptCompletion = false;
        var _didIteratorError = false;
        var _iteratorError;
        try {
          for (var _iterator = _asyncIterator(files), _step; _iteratorAbruptCompletion = !(_step = await _iterator.next()).done; _iteratorAbruptCompletion = false) {
            const file = _step.value;
            {
              switch (true) {
                case file.getDisplayPath().endsWith('rocketchat.info'):
                  {
                    await processFile(file);
                    break;
                  }
                case file.getDisplayPath().endsWith('rocketchat-supported-versions.info'):
                  {
                    if (process.env.NODE_ENV === 'development') {
                      file.addJavaScript({
                        data: "exports.supportedVersions = {}",
                        path: "".concat(file.getPathInPackage(), ".js")
                      });
                      break;
                    }
                    await processVersionFile(file);
                    break;
                  }
                default:
                  {
                    throw new Error("Unexpected file ".concat(file.getDisplayPath()));
                  }
              }
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (_iteratorAbruptCompletion && _iterator.return != null) {
              await _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    }
    Plugin.registerCompiler({
      extensions: ['info']
    }, function () {
      return new VersionCompiler();
    });
    __reify_async_result__();
  } catch (_reifyError) {
    return __reify_async_result__(_reifyError);
  }
  __reify_async_result__()
}, {
  self: this,
  async: false
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});


/* Exports */
return {
  require: require,
  eagerModulePaths: [
    "/node_modules/meteor/compileVersion/plugin/compile-version.js"
  ]
}});

//# sourceURL=meteor://💻app/packages/compileVersion_plugin.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY29tcGlsZVZlcnNpb24vcGx1Z2luL2NvbXBpbGUtdmVyc2lvbi5qcyJdLCJuYW1lcyI6WyJfYXN5bmNJdGVyYXRvciIsIm1vZHVsZSIsImxpbmsiLCJkZWZhdWx0IiwidiIsImV4ZWMiLCJvcyIsInV0aWwiLCJwYXRoIiwiZnMiLCJodHRwcyIsIl9fcmVpZnlXYWl0Rm9yRGVwc19fIiwiZXhlY0FzeW5jIiwicHJvbWlzaWZ5IiwiVmVyc2lvbkNvbXBpbGVyIiwicHJvY2Vzc0ZpbGVzRm9yVGFyZ2V0IiwiZmlsZXMiLCJwcm9jZXNzVmVyc2lvbkZpbGUiLCJmaWxlIiwiZGF0YSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiX0pTT04kcGFyc2UiLCJjdXJyZW50VmVyc2lvbiIsIkpTT04iLCJwYXJzZSIsInJlYWRGaWxlU3luYyIsInByb2Nlc3MiLCJjd2QiLCJlbmNvZGluZyIsInZlcnNpb24iLCJ0eXBlIiwiaW5jbHVkZXMiLCJ1cmwiLCJjb25jYXQiLCJoYW5kbGVFcnJvciIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsImVudiIsIk5PREVfRU5WIiwiZ2V0IiwicmVzcG9uc2UiLCJvbiIsImNodW5rIiwic3VwcG9ydGVkVmVyc2lvbnMiLCJzaWduZWQiLCJFcnJvciIsIk1hdGgiLCJhYnMiLCJEYXRlIiwiZ2V0VGltZSIsInRpbWVzdGFtcCIsIl9pdGVyYXRvckFicnVwdENvbXBsZXRpb24yIiwiX2RpZEl0ZXJhdG9yRXJyb3IyIiwiX2l0ZXJhdG9yRXJyb3IyIiwiX2l0ZXJhdG9yMiIsInZlcnNpb25zIiwiX3N0ZXAyIiwibmV4dCIsImRvbmUiLCJ2YWx1ZSIsImV4cGlyYXRpb24iLCJyZXR1cm4iLCJlbmQiLCJhZGRKYXZhU2NyaXB0Iiwic3RyaW5naWZ5IiwiZ2V0UGF0aEluUGFja2FnZSIsInByb2Nlc3NGaWxlIiwiX0pTT04kcGFyc2UyIiwiX0pTT04kcGFyc2UyJHJvY2tldGNoIiwib3V0cHV0IiwiZ2V0Q29udGVudHNBc1N0cmluZyIsImJ1aWxkIiwiZGF0ZSIsInRvSVNPU3RyaW5nIiwibm9kZVZlcnNpb24iLCJhcmNoIiwicGxhdGZvcm0iLCJvc1JlbGVhc2UiLCJyZWxlYXNlIiwidG90YWxNZW1vcnkiLCJ0b3RhbG1lbSIsImZyZWVNZW1vcnkiLCJmcmVlbWVtIiwiY3B1cyIsImxlbmd0aCIsIm1hcmtldHBsYWNlQXBpVmVyc2lvbiIsInJlcXVpcmUiLCJyZXBsYWNlIiwibWluaW11bUNsaWVudFZlcnNpb25zIiwicm9ja2V0Y2hhdCIsInJlc3VsdCIsInN0ZG91dCIsInNwbGl0IiwiY29tbWl0IiwiaGFzaCIsInNoaWZ0IiwiYXV0aG9yIiwic3ViamVjdCIsImpvaW4iLCJlIiwidGFncyIsInRhZyIsImJyYW5jaCIsIl9pdGVyYXRvckFicnVwdENvbXBsZXRpb24iLCJfZGlkSXRlcmF0b3JFcnJvciIsIl9pdGVyYXRvckVycm9yIiwiX2l0ZXJhdG9yIiwiX3N0ZXAiLCJnZXREaXNwbGF5UGF0aCIsImVuZHNXaXRoIiwiUGx1Z2luIiwicmVnaXN0ZXJDb21waWxlciIsImV4dGVuc2lvbnMiLCJfX3JlaWZ5X2FzeW5jX3Jlc3VsdF9fIiwiX3JlaWZ5RXJyb3IiLCJzZWxmIiwiYXN5bmMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7SUFBQSxJQUFJQSxjQUFjO0lBQUNDLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLHNDQUFzQyxFQUFDO01BQUNDLE9BQU9BLENBQUNDLENBQUMsRUFBQztRQUFDSixjQUFjLEdBQUNJLENBQUM7TUFBQTtJQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFBdkcsSUFBSUMsSUFBSTtJQUFDSixNQUFNLENBQUNDLElBQUksQ0FBQyxlQUFlLEVBQUM7TUFBQ0csSUFBSUEsQ0FBQ0QsQ0FBQyxFQUFDO1FBQUNDLElBQUksR0FBQ0QsQ0FBQztNQUFBO0lBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUFDLElBQUlFLEVBQUU7SUFBQ0wsTUFBTSxDQUFDQyxJQUFJ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QixDQUFDQyxJQUFJLENBQUM7b0JBQzlCO2tCQUNEO2dCQUNBO2tCQUFTO29CQUNSLE1BQU0sSUFBSThCLEtBQUssb0JBQUFiLE1BQUEsQ0FBb0JqQixJQUFJLENBQUM2RixjQUFjLENBQUMsQ0FBQyxDQUFFLENBQUM7a0JBQzVEO2NBQ0Q7WUFBQztVQUNGO1FBQUMsU0FBQTFFLEdBQUE7VUFBQXNFLGlCQUFBO1VBQUFDLGNBQUEsR0FBQXZFLEdBQUE7UUFBQTtVQUFBO1lBQUEsSUFBQXFFLHlCQUFBLElBQUFHLFNBQUEsQ0FBQTdDLE1BQUE7Y0FBQSxNQUFBNkMsU0FBQSxDQUFBN0MsTUFBQTtZQUFBO1VBQUE7WUFBQSxJQUFBMkMsaUJBQUE7Y0FBQSxNQUFBQyxjQUFBO1lBQUE7VUFBQTtRQUFBO01BQ0Y7SUFDRDtJQUVBSyxNQUFNLENBQUNDLGdCQUFnQixDQUN0QjtNQUNDQyxVQUFVLEVBQUUsQ0FBQyxNQUFNO0lBQ3BCLENBQUMsRUFDRCxZQUFZO01BQ1gsT0FBTyxJQUFJckcsZUFBZSxDQUFDLENBQUM7SUFDN0IsQ0FDRCxDQUFDO0lBQUNzRyxzQkFBQTtFQUFBLFNBQUFDLFdBQUE7SUFBQSxPQUFBRCxzQkFBQSxDQUFBQyxXQUFBO0VBQUE7RUFBQUQsc0JBQUE7QUFBQTtFQUFBRSxJQUFBO0VBQUFDLEtBQUE7QUFBQSxHIiwiZmlsZSI6Ii9wYWNrYWdlcy9jb21waWxlVmVyc2lvbl9wbHVnaW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleGVjIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgb3MgZnJvbSAnb3MnO1xuaW1wb3J0IHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgaHR0cHMgZnJvbSAnaHR0cHMnO1xuXG5jb25zdCBleGVjQXN5bmMgPSB1dGlsLnByb21pc2lmeShleGVjKTtcblxuY2xhc3MgVmVyc2lvbkNvbXBpbGVyIHtcblx0YXN5bmMgcHJvY2Vzc0ZpbGVzRm9yVGFyZ2V0KGZpbGVzKSB7XG5cdFx0Y29uc3QgcHJvY2Vzc1ZlcnNpb25GaWxlID0gYXN5bmMgZnVuY3Rpb24gKGZpbGUpIHtcblx0XHRcdGNvbnN0IGRhdGEgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdGNvbnN0IGN1cnJlbnRWZXJzaW9uID1cblx0XHRcdFx0XHRKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJy4vcGFja2FnZS5qc29uJyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KSk/LnZlcnNpb24gfHwgJyc7XG5cblx0XHRcdFx0Y29uc3QgdHlwZSA9IGN1cnJlbnRWZXJzaW9uLmluY2x1ZGVzKCctcmMuJykgPyAnY2FuZGlkYXRlJyA6IGN1cnJlbnRWZXJzaW9uLmluY2x1ZGVzKCctZGV2ZWxvcCcpID8gJ2RldmVsb3AnIDogJ3N0YWJsZSc7XG5cblx0XHRcdFx0Y29uc3QgdXJsID0gYGh0dHBzOi8vcmVsZWFzZXMucm9ja2V0LmNoYXQvdjIvc2VydmVyL3N1cHBvcnRlZFZlcnNpb25zP2luY2x1ZGVEcmFmdFR5cGU9JHt0eXBlfSZpbmNsdWRlRHJhZnRUYWc9JHtjdXJyZW50VmVyc2lvbn1gO1xuXG5cdFx0XHRcdGZ1bmN0aW9uIGhhbmRsZUVycm9yKGVycikge1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyKTtcblx0XHRcdFx0XHQvLyBUT0RPIHJlbW92ZSB0aGlzIHdoZW4gd2UgYXJlIHJlYWR5IHRvIGZhaWxcblx0XHRcdFx0XHRpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdkZXZlbG9wbWVudCcpIHtcblx0XHRcdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXNvbHZlKHt9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGh0dHBzXG5cdFx0XHRcdFx0LmdldCh1cmwsIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0bGV0IGRhdGEgPSAnJztcblx0XHRcdFx0XHRcdHJlc3BvbnNlLm9uKCdkYXRhJywgZnVuY3Rpb24gKGNodW5rKSB7XG5cdFx0XHRcdFx0XHRcdGRhdGEgKz0gY2h1bms7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdHJlc3BvbnNlLm9uKCdlbmQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IHN1cHBvcnRlZFZlcnNpb25zID0gSlNPTi5wYXJzZShkYXRhKTtcblx0XHRcdFx0XHRcdFx0aWYgKCFzdXBwb3J0ZWRWZXJzaW9ucz8uc2lnbmVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGhhbmRsZUVycm9yKG5ldyBFcnJvcihgSW52YWxpZCBzdXBwb3J0ZWRWZXJzaW9ucyByZXN1bHQ6XFxuICBVUkw6ICR7dXJsfSBcXG4gIFJFU1VMVDogJHtkYXRhfWApKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdC8vIGNoZWNrIGlmIHRpbWVzdGFtcCBpcyBpbnNpZGUgMSBob3VyIHdpdGhpbiBidWlsZFxuXHRcdFx0XHRcdFx0XHRpZiAoTWF0aC5hYnMobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZShzdXBwb3J0ZWRWZXJzaW9ucy50aW1lc3RhbXApLmdldFRpbWUoKSkgPiAxMDAwICogNjAgKiA2MCkge1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybiBoYW5kbGVFcnJvcihuZXcgRXJyb3IoYEludmFsaWQgc3VwcG9ydGVkVmVyc2lvbnMgdGltZXN0YW1wOlxcbiAgVVJMOiAke3VybH0gXFxuICBSRVNVTFQ6ICR7ZGF0YX1gKSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRmb3IgYXdhaXQgKGNvbnN0IHZlcnNpb24gb2Ygc3VwcG9ydGVkVmVyc2lvbnMudmVyc2lvbnMpIHtcblx0XHRcdFx0XHRcdFx0XHQvLyBjaGVjayBpZiBleHBpcmF0aW9uIGlzIGFmdGVyIHRoZSBmaXJzdCByb2NrZXQuY2hhdCByZWxlYXNlXG5cdFx0XHRcdFx0XHRcdFx0aWYgKG5ldyBEYXRlKHZlcnNpb24uZXhwaXJhdGlvbikgPCBuZXcgRGF0ZSgnMjAxOS0wNC0wMVQwMDowMDowMC4wMDBaJykpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBoYW5kbGVFcnJvcihuZXcgRXJyb3IoYEludmFsaWQgc3VwcG9ydGVkVmVyc2lvbnMgZXhwaXJhdGlvbjpcXG4gIFVSTDogJHt1cmx9IFxcbiAgUkVTVUxUOiAke2RhdGF9YCkpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHJlc29sdmUoc3VwcG9ydGVkVmVyc2lvbnMpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRyZXNwb25zZS5vbignZXJyb3InLCBmdW5jdGlvbiAoZXJyKSB7XG5cdFx0XHRcdFx0XHRcdGhhbmRsZUVycm9yKGVycik7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5lbmQoKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRmaWxlLmFkZEphdmFTY3JpcHQoe1xuXHRcdFx0XHRkYXRhOiBgZXhwb3J0cy5zdXBwb3J0ZWRWZXJzaW9ucyA9ICR7SlNPTi5zdHJpbmdpZnkoZGF0YSl9YCxcblx0XHRcdFx0cGF0aDogYCR7ZmlsZS5nZXRQYXRoSW5QYWNrYWdlKCl9LmpzYCxcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHRjb25zdCBwcm9jZXNzRmlsZSA9IGFzeW5jIGZ1bmN0aW9uIChmaWxlKSB7XG5cdFx0XHRsZXQgb3V0cHV0ID0gSlNPTi5wYXJzZShmaWxlLmdldENvbnRlbnRzQXNTdHJpbmcoKSk7XG5cdFx0XHRvdXRwdXQuYnVpbGQgPSB7XG5cdFx0XHRcdGRhdGU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcblx0XHRcdFx0bm9kZVZlcnNpb246IHByb2Nlc3MudmVyc2lvbixcblx0XHRcdFx0YXJjaDogcHJvY2Vzcy5hcmNoLFxuXHRcdFx0XHRwbGF0Zm9ybTogcHJvY2Vzcy5wbGF0Zm9ybSxcblx0XHRcdFx0b3NSZWxlYXNlOiBvcy5yZWxlYXNlKCksXG5cdFx0XHRcdHRvdGFsTWVtb3J5OiBvcy50b3RhbG1lbSgpLFxuXHRcdFx0XHRmcmVlTWVtb3J5OiBvcy5mcmVlbWVtKCksXG5cdFx0XHRcdGNwdXM6IG9zLmNwdXMoKS5sZW5ndGgsXG5cdFx0XHR9O1xuXG5cdFx0XHRvdXRwdXQubWFya2V0cGxhY2VBcGlWZXJzaW9uID0gcmVxdWlyZSgnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL3BhY2thZ2UuanNvbicpLnZlcnNpb24ucmVwbGFjZSgvXlteMC05XS9nLCAnJyk7XG5cdFx0XHRjb25zdCBtaW5pbXVtQ2xpZW50VmVyc2lvbnMgPVxuXHRcdFx0XHRKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJy4vcGFja2FnZS5qc29uJyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KSk/LnJvY2tldGNoYXRcblx0XHRcdFx0XHQ/Lm1pbmltdW1DbGllbnRWZXJzaW9ucyB8fCB7fTtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4ZWNBc3luYyhcImdpdCBsb2cgLS1wcmV0dHk9Zm9ybWF0OiclSCVuJWFkJW4lYW4lbiVzJyAtbiAxXCIpO1xuXHRcdFx0XHRjb25zdCBkYXRhID0gcmVzdWx0LnN0ZG91dC5zcGxpdCgnXFxuJyk7XG5cdFx0XHRcdG91dHB1dC5jb21taXQgPSB7XG5cdFx0XHRcdFx0aGFzaDogZGF0YS5zaGlmdCgpLFxuXHRcdFx0XHRcdGRhdGU6IGRhdGEuc2hpZnQoKSxcblx0XHRcdFx0XHRhdXRob3I6IGRhdGEuc2hpZnQoKSxcblx0XHRcdFx0XHRzdWJqZWN0OiBkYXRhLmpvaW4oJ1xcbicpLFxuXHRcdFx0XHR9O1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdkZXZlbG9wbWVudCcpIHtcblx0XHRcdFx0XHR0aHJvdyBlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIG5vIGdpdFxuXHRcdFx0fVxuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCB0YWdzID0gYXdhaXQgZXhlY0FzeW5jKCdnaXQgZGVzY3JpYmUgLS1hYmJyZXY9MCAtLXRhZ3MnKTtcblx0XHRcdFx0aWYgKG91dHB1dC5jb21taXQpIHtcblx0XHRcdFx0XHRvdXRwdXQuY29tbWl0LnRhZyA9IHRhZ3Muc3Rkb3V0LnJlcGxhY2UoJ1xcbicsICcnKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHQvLyBubyB0YWdzXG5cdFx0XHR9XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGJyYW5jaCA9IGF3YWl0IGV4ZWNBc3luYygnZ2l0IHJldi1wYXJzZSAtLWFiYnJldi1yZWYgSEVBRCcpO1xuXHRcdFx0XHRpZiAob3V0cHV0LmNvbW1pdCkge1xuXHRcdFx0XHRcdG91dHB1dC5jb21taXQuYnJhbmNoID0gYnJhbmNoLnN0ZG91dC5yZXBsYWNlKCdcXG4nLCAnJyk7XG5cdFx0XHRcdH1cblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAnZGV2ZWxvcG1lbnQnKSB7XG5cdFx0XHRcdFx0dGhyb3cgZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIG5vIGJyYW5jaFxuXHRcdFx0fVxuXG5cdFx0XHRmaWxlLmFkZEphdmFTY3JpcHQoe1xuXHRcdFx0XHRkYXRhOiBgZXhwb3J0cy5JbmZvID0gJHtKU09OLnN0cmluZ2lmeShvdXRwdXQsIG51bGwsIDQpfTtcblx0XHRcdFx0ZXhwb3J0cy5taW5pbXVtQ2xpZW50VmVyc2lvbnMgPSAke0pTT04uc3RyaW5naWZ5KG1pbmltdW1DbGllbnRWZXJzaW9ucywgbnVsbCwgNCl9O2AsXG5cdFx0XHRcdHBhdGg6IGAke2ZpbGUuZ2V0UGF0aEluUGFja2FnZSgpfS5qc2AsXG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0Zm9yIGF3YWl0IChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG5cdFx0XHRzd2l0Y2ggKHRydWUpIHtcblx0XHRcdFx0Y2FzZSBmaWxlLmdldERpc3BsYXlQYXRoKCkuZW5kc1dpdGgoJ3JvY2tldGNoYXQuaW5mbycpOiB7XG5cdFx0XHRcdFx0YXdhaXQgcHJvY2Vzc0ZpbGUoZmlsZSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y2FzZSBmaWxlLmdldERpc3BsYXlQYXRoKCkuZW5kc1dpdGgoJ3JvY2tldGNoYXQtc3VwcG9ydGVkLXZlcnNpb25zLmluZm8nKToge1xuXHRcdFx0XHRcdGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jykge1xuXHRcdFx0XHRcdFx0ZmlsZS5hZGRKYXZhU2NyaXB0KHtcblx0XHRcdFx0XHRcdFx0ZGF0YTogYGV4cG9ydHMuc3VwcG9ydGVkVmVyc2lvbnMgPSB7fWAsXG5cdFx0XHRcdFx0XHRcdHBhdGg6IGAke2ZpbGUuZ2V0UGF0aEluUGFja2FnZSgpfS5qc2AsXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRhd2FpdCBwcm9jZXNzVmVyc2lvbkZpbGUoZmlsZSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZGVmYXVsdDoge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCBmaWxlICR7ZmlsZS5nZXREaXNwbGF5UGF0aCgpfWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG5cblBsdWdpbi5yZWdpc3RlckNvbXBpbGVyKFxuXHR7XG5cdFx0ZXh0ZW5zaW9uczogWydpbmZvJ10sXG5cdH0sXG5cdGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbmV3IFZlcnNpb25Db21waWxlcigpO1xuXHR9LFxuKTtcbiJdfQ==
