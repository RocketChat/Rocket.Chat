(function () {

/* Imports */
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
let fs;
module.link("fs", {
  default(v) {
    fs = v;
  }

}, 2);
let path;
module.link("path", {
  default(v) {
    path = v;
  }

}, 3);
let Future;
module.link("fibers/future", {
  default(v) {
    Future = v;
  }

}, 4);
let async;
module.link("async", {
  default(v) {
    async = v;
  }

}, 5);

class VersionCompiler {
  processFilesForTarget(files) {
    const future = new Future();

    const processFile = function (file, cb) {
      if (!file.getDisplayPath().match(/rocketchat\.info$/)) {
        return cb();
      }

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
      exec("git log --pretty=format:'%H%n%ad%n%an%n%s' -n 1", function (err, result) {
        if (err == null) {
          result = result.split('\n');
          output.commit = {
            hash: result.shift(),
            date: result.shift(),
            author: result.shift(),
            subject: result.join('\n')
          };
        }

        exec('git describe --abbrev=0 --tags', function (err, result) {
          if (err == null && output.commit != null) {
            output.commit.tag = result.replace('\n', '');
          }

          exec('git rev-parse --abbrev-ref HEAD', function (err, result) {
            if (err == null && output.commit != null) {
              output.commit.branch = result.replace('\n', '');
            }

            const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
            output.marketplaceApiVersion = pkg.dependencies['@rocket.chat/apps-engine'].replace(/^[^0-9]/g, '');
            output = "exports.Info = ".concat(JSON.stringify(output, null, 4), ";");
            file.addJavaScript({
              data: output,
              path: "".concat(file.getPathInPackage(), ".js")
            });
            cb();
          });
        });
      });
    };

    async.each(files, processFile, future.resolver());
    return future.wait();
  }

}

Plugin.registerCompiler({
  extensions: ['info']
}, function () {
  return new VersionCompiler();
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/compileVersion/plugin/compile-version.js");

/* Exports */
Package._define("compileVersion");

})();

//# sourceURL=meteor://💻app/packages/compileVersion_plugin.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY29tcGlsZVZlcnNpb24vcGx1Z2luL2NvbXBpbGUtdmVyc2lvbi5qcyJdLCJuYW1lcyI6WyJleGVjIiwibW9kdWxlIiwibGluayIsInYiLCJvcyIsImRlZmF1bHQiLCJmcyIsInBhdGgiLCJGdXR1cmUiLCJhc3luYyIsIlZlcnNpb25Db21waWxlciIsInByb2Nlc3NGaWxlc0ZvclRhcmdldCIsImZpbGVzIiwiZnV0dXJlIiwicHJvY2Vzc0ZpbGUiLCJmaWxlIiwiY2IiLCJnZXREaXNwbGF5UGF0aCIsIm1hdGNoIiwib3V0cHV0IiwiSlNPTiIsInBhcnNlIiwiZ2V0Q29udGVudHNBc1N0cmluZyIsImJ1aWxkIiwiZGF0ZSIsIkRhdGUiLCJ0b0lTT1N0cmluZyIsIm5vZGVWZXJzaW9uIiwicHJvY2VzcyIsInZlcnNpb24iLCJhcmNoIiwicGxhdGZvcm0iLCJvc1JlbGVhc2UiLCJyZWxlYXNlIiwidG90YWxNZW1vcnkiLCJ0b3RhbG1lbSIsImZyZWVNZW1vcnkiLCJmcmVlbWVtIiwiY3B1cyIsImxlbmd0aCIsImVyciIsInJlc3VsdCIsInNwbGl0IiwiY29tbWl0IiwiaGFzaCIsInNoaWZ0IiwiYXV0aG9yIiwic3ViamVjdCIsImpvaW4iLCJ0YWciLCJyZXBsYWNlIiwiYnJhbmNoIiwicGtnIiwicmVhZEZpbGVTeW5jIiwiY3dkIiwibWFya2V0cGxhY2VBcGlWZXJzaW9uIiwiZGVwZW5kZW5jaWVzIiwic3RyaW5naWZ5IiwiYWRkSmF2YVNjcmlwdCIsImRhdGEiLCJnZXRQYXRoSW5QYWNrYWdlIiwiZWFjaCIsInJlc29sdmVyIiwid2FpdCIsIlBsdWdpbiIsInJlZ2lzdGVyQ29tcGlsZXIiLCJleHRlbnNpb25zIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxJQUFKO0FBQVNDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLGVBQVosRUFBNEI7QUFBQ0YsTUFBSSxDQUFDRyxDQUFELEVBQUc7QUFB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QUFtREFQLFNBQUssQ0FBQ29ELElBQU4sQ0FBV2pELEtBQVgsRUFBa0JFLFdBQWxCLEVBQStCRCxNQUFNLENBQUNpRCxRQUFQLEVBQS9CO0FBQ0EsV0FBT2pELE1BQU0sQ0FBQ2tELElBQVAsRUFBUDtBQUNBOztBQXhEb0I7O0FBMkR0QkMsTUFBTSxDQUFDQyxnQkFBUCxDQUNDO0FBQ0NDLFlBQVUsRUFBRSxDQUFDLE1BQUQ7QUFEYixDQURELEVBSUMsWUFBWTtBQUNYLFNBQU8sSUFBSXhELGVBQUosRUFBUDtBQUNBLENBTkYsRSIsImZpbGUiOiIvcGFja2FnZXMvY29tcGlsZVZlcnNpb25fcGx1Z2luLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhlYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IG9zIGZyb20gJ29zJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuaW1wb3J0IEZ1dHVyZSBmcm9tICdmaWJlcnMvZnV0dXJlJztcbmltcG9ydCBhc3luYyBmcm9tICdhc3luYyc7XG5cbmNsYXNzIFZlcnNpb25Db21waWxlciB7XG5cdHByb2Nlc3NGaWxlc0ZvclRhcmdldChmaWxlcykge1xuXHRcdGNvbnN0IGZ1dHVyZSA9IG5ldyBGdXR1cmUoKTtcblx0XHRjb25zdCBwcm9jZXNzRmlsZSA9IGZ1bmN0aW9uIChmaWxlLCBjYikge1xuXHRcdFx0aWYgKCFmaWxlLmdldERpc3BsYXlQYXRoKCkubWF0Y2goL3JvY2tldGNoYXRcXC5pbmZvJC8pKSB7XG5cdFx0XHRcdHJldHVybiBjYigpO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgb3V0cHV0ID0gSlNPTi5wYXJzZShmaWxlLmdldENvbnRlbnRzQXNTdHJpbmcoKSk7XG5cdFx0XHRvdXRwdXQuYnVpbGQgPSB7XG5cdFx0XHRcdGRhdGU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcblx0XHRcdFx0bm9kZVZlcnNpb246IHByb2Nlc3MudmVyc2lvbixcblx0XHRcdFx0YXJjaDogcHJvY2Vzcy5hcmNoLFxuXHRcdFx0XHRwbGF0Zm9ybTogcHJvY2Vzcy5wbGF0Zm9ybSxcblx0XHRcdFx0b3NSZWxlYXNlOiBvcy5yZWxlYXNlKCksXG5cdFx0XHRcdHRvdGFsTWVtb3J5OiBvcy50b3RhbG1lbSgpLFxuXHRcdFx0XHRmcmVlTWVtb3J5OiBvcy5mcmVlbWVtKCksXG5cdFx0XHRcdGNwdXM6IG9zLmNwdXMoKS5sZW5ndGgsXG5cdFx0XHR9O1xuXG5cdFx0XHRleGVjKFwiZ2l0IGxvZyAtLXByZXR0eT1mb3JtYXQ6JyVIJW4lYWQlbiVhbiVuJXMnIC1uIDFcIiwgZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7XG5cdFx0XHRcdGlmIChlcnIgPT0gbnVsbCkge1xuXHRcdFx0XHRcdHJlc3VsdCA9IHJlc3VsdC5zcGxpdCgnXFxuJyk7XG5cdFx0XHRcdFx0b3V0cHV0LmNvbW1pdCA9IHtcblx0XHRcdFx0XHRcdGhhc2g6IHJlc3VsdC5zaGlmdCgpLFxuXHRcdFx0XHRcdFx0ZGF0ZTogcmVzdWx0LnNoaWZ0KCksXG5cdFx0XHRcdFx0XHRhdXRob3I6IHJlc3VsdC5zaGlmdCgpLFxuXHRcdFx0XHRcdFx0c3ViamVjdDogcmVzdWx0LmpvaW4oJ1xcbicpLFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRleGVjKCdnaXQgZGVzY3JpYmUgLS1hYmJyZXY9MCAtLXRhZ3MnLCBmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcblx0XHRcdFx0XHRpZiAoZXJyID09IG51bGwgJiYgb3V0cHV0LmNvbW1pdCAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRvdXRwdXQuY29tbWl0LnRhZyA9IHJlc3VsdC5yZXBsYWNlKCdcXG4nLCAnJyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGV4ZWMoJ2dpdCByZXYtcGFyc2UgLS1hYmJyZXYtcmVmIEhFQUQnLCBmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcblx0XHRcdFx0XHRcdGlmIChlcnIgPT0gbnVsbCAmJiBvdXRwdXQuY29tbWl0ICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0b3V0cHV0LmNvbW1pdC5icmFuY2ggPSByZXN1bHQucmVwbGFjZSgnXFxuJywgJycpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRjb25zdCBwa2cgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3BhY2thZ2UuanNvbicpLCAndXRmOCcpKTtcblx0XHRcdFx0XHRcdG91dHB1dC5tYXJrZXRwbGFjZUFwaVZlcnNpb24gPSBwa2cuZGVwZW5kZW5jaWVzWydAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUnXS5yZXBsYWNlKC9eW14wLTldL2csICcnKTtcblxuXHRcdFx0XHRcdFx0b3V0cHV0ID0gYGV4cG9ydHMuSW5mbyA9ICR7SlNPTi5zdHJpbmdpZnkob3V0cHV0LCBudWxsLCA0KX07YDtcblx0XHRcdFx0XHRcdGZpbGUuYWRkSmF2YVNjcmlwdCh7XG5cdFx0XHRcdFx0XHRcdGRhdGE6IG91dHB1dCxcblx0XHRcdFx0XHRcdFx0cGF0aDogYCR7ZmlsZS5nZXRQYXRoSW5QYWNrYWdlKCl9LmpzYCxcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0Y2IoKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0YXN5bmMuZWFjaChmaWxlcywgcHJvY2Vzc0ZpbGUsIGZ1dHVyZS5yZXNvbHZlcigpKTtcblx0XHRyZXR1cm4gZnV0dXJlLndhaXQoKTtcblx0fVxufVxuXG5QbHVnaW4ucmVnaXN0ZXJDb21waWxlcihcblx0e1xuXHRcdGV4dGVuc2lvbnM6IFsnaW5mbyddLFxuXHR9LFxuXHRmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBWZXJzaW9uQ29tcGlsZXIoKTtcblx0fSxcbik7XG4iXX0=
