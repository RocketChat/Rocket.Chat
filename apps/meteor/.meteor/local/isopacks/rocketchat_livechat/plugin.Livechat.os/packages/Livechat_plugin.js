Package["core-runtime"].queue("Livechat",function () {/* Imports */
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"Livechat":{"plugin":{"build-livechat.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/Livechat/plugin/build-livechat.js                                                                       //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reify_async_result__) {
  "use strict";
  try {
    let path;
    module.link("path", {
      default(v) {
        path = v;
      }
    }, 0);
    let execSync;
    module.link("child_process", {
      execSync(v) {
        execSync = v;
      }
    }, 1);
    let fs;
    module.link("fs", {
      default(v) {
        fs = v;
      }
    }, 2);
    let UglifyJS;
    module.link("uglify-js", {
      default(v) {
        UglifyJS = v;
      }
    }, 3);
    if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();
    const livechatSource = path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocket-livechat.js');
    const livechatTarget = path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocketchat-livechat.min.js');
    fs.writeFileSync(livechatTarget, UglifyJS.minify(livechatSource).code);
    const packagePath = path.join(path.resolve('.'), 'packages', 'rocketchat-livechat');
    const pluginPath = path.join(packagePath, 'plugin');
    const options = {
      env: process.env
    };
    if (process.platform === 'win32') {
      execSync("".concat(pluginPath, "/build.bat"), options);
    } else {
      execSync("sh ".concat(pluginPath, "/build.sh"), options);
    }
    __reify_async_result__();
  } catch (_reifyError) {
    return __reify_async_result__(_reifyError);
  }
  __reify_async_result__()
}, {
  self: this,
  async: false
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"uglify-js":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/Livechat/node_modules/uglify-js/package.json                                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.exports = {
  "name": "uglify-js",
  "version": "2.8.29",
  "main": "tools/node.js"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"tools":{"node.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/Livechat/node_modules/uglify-js/tools/node.js                                                //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});


/* Exports */
return {
  require: require,
  eagerModulePaths: [
    "/node_modules/meteor/Livechat/plugin/build-livechat.js"
  ]
}});

//# sourceURL=meteor://💻app/packages/Livechat_plugin.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvTGl2ZWNoYXQvcGx1Z2luL2J1aWxkLWxpdmVjaGF0LmpzIl0sIm5hbWVzIjpbInBhdGgiLCJtb2R1bGUiLCJsaW5rIiwiZGVmYXVsdCIsInYiLCJleGVjU3luYyIsImZzIiwiVWdsaWZ5SlMiLCJfX3JlaWZ5V2FpdEZvckRlcHNfXyIsImxpdmVjaGF0U291cmNlIiwicmVzb2x2ZSIsImxpdmVjaGF0VGFyZ2V0Iiwid3JpdGVGaWxlU3luYyIsIm1pbmlmeSIsImNvZGUiLCJwYWNrYWdlUGF0aCIsImpvaW4iLCJwbHVnaW5QYXRoIiwib3B0aW9ucyIsImVudiIsInByb2Nlc3MiLCJwbGF0Zm9ybSIsImNvbmNhdCIsIl9fcmVpZnlfYXN5bmNfcmVzdWx0X18iLCJfcmVpZnlFcnJvciIsInNlbGYiLCJhc3luYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztJQUFBLElBQUlBLElBQUk7SUFBQ0MsTUFBTSxDQUFDQyxJQUFJLENBQUMsTUFBTSxFQUFDO01BQUNDLE9BQU9BLENBQUNDLENBQUMsRUFBQztRQUFDSixJQUFJLEdBQUNJLENBQUM7TUFBQTtJQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFBQyxJQUFJQyxRQUFRO0lBQUNKLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLGVBQWUsRUFBQztNQUFDRyxRQUFRQSxDQUFDRCxDQUFDLEVBQUM7UUFBQ0MsUUFBUSxHQUFDRCxDQUFDO01BQUE7SUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQUMsSUFBSUUsRUFBRTtJQUFDTCxNQUFNLENBQUNDLElBQUksQ0FBQyxJQUFJLEVBQUM7TUFBQ0MsT0FBT0EsQ0FBQ0MsQ0FBQyxFQUFDO1FBQUNFLEVBQUUsR0FBQ0YsQ0FBQztNQUFBO0lBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUFDLElBQUlHLFFBQVE7SUFBQ04sTUFBTSxDQUFDQyxJQUFJLENBQUMsV0FBVyxFQUFDO01BQUNDLE9BQU9BLENBQUNDLENBQUMsRUFBQztRQUFDRyxRQUFRLEdBQUNILENBQUM7TUFBQTtJQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFBQyxJQUFJSSxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNQSxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQU1yUyxNQUFNQyxjQUFjLEdBQUdULElBQUksQ0FBQ1UsT0FBTyxDQUFDLFVBQVUsRUFBRSxxQkFBcUIsRUFBRSxRQUFRLEVBQUUsb0JBQW9CLENBQUM7SUFDdEcsTUFBTUMsY0FBYyxHQUFHWCxJQUFJLENBQUNVLE9BQU8sQ0FBQyxVQUFVLEVBQUUscUJBQXFCLEVBQUUsUUFBUSxFQUFFLDRCQUE0QixDQUFDO0lBRTlHSixFQUFFLENBQUNNLGFBQWEsQ0FBQ0QsY0FBYyxFQUFFSixRQUFRLENBQUNNLE1BQU0sQ0FBQ0osY0FBYyxDQUFDLENBQUNLLElBQUksQ0FBQztJQUV0RSxNQUFNQyxXQUFXLEdBQUdmLElBQUksQ0FBQ2dCLElBQUksQ0FBQ2hCLElBQUksQ0FBQ1UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFVBQVUsRUFBRSxxQkFBcUIsQ0FBQztJQUNuRixNQUFNTyxVQUFVLEdBQUdqQixJQUFJLENBQUNnQixJQUFJLENBQUNELFdBQVcsRUFBRSxRQUFRLENBQUM7SUFFbkQsTUFBTUcsT0FBTyxHQUFHO01BQ2ZDLEdBQUcsRUFBRUMsT0FBTyxDQUFDRDtJQUNkLENBQUM7SUFFRCxJQUFJQyxPQUFPLENBQUNDLFFBQVEsS0FBSyxPQUFPLEVBQUU7TUFDakNoQixRQUFRLElBQUFpQixNQUFBLENBQUlMLFVBQVUsaUJBQWNDLE9BQU8sQ0FBQztJQUM3QyxDQUFDLE1BQU07TUFDTmIsUUFBUSxPQUFBaUIsTUFBQSxDQUFPTCxVQUFVLGdCQUFhQyxPQUFPLENBQUM7SUFDL0M7SUFBQ0ssc0JBQUE7RUFBQSxTQUFBQyxXQUFBO0lBQUEsT0FBQUQsc0JBQUEsQ0FBQUMsV0FBQTtFQUFBO0VBQUFELHNCQUFBO0FBQUE7RUFBQUUsSUFBQTtFQUFBQyxLQUFBO0FBQUEsRyIsImZpbGUiOiIvcGFja2FnZXMvTGl2ZWNoYXRfcGx1Z2luLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcblxuaW1wb3J0IFVnbGlmeUpTIGZyb20gJ3VnbGlmeS1qcyc7XG5cbmNvbnN0IGxpdmVjaGF0U291cmNlID0gcGF0aC5yZXNvbHZlKCdwYWNrYWdlcycsICdyb2NrZXRjaGF0LWxpdmVjaGF0JywgJ2Fzc2V0cycsICdyb2NrZXQtbGl2ZWNoYXQuanMnKTtcbmNvbnN0IGxpdmVjaGF0VGFyZ2V0ID0gcGF0aC5yZXNvbHZlKCdwYWNrYWdlcycsICdyb2NrZXRjaGF0LWxpdmVjaGF0JywgJ2Fzc2V0cycsICdyb2NrZXRjaGF0LWxpdmVjaGF0Lm1pbi5qcycpO1xuXG5mcy53cml0ZUZpbGVTeW5jKGxpdmVjaGF0VGFyZ2V0LCBVZ2xpZnlKUy5taW5pZnkobGl2ZWNoYXRTb3VyY2UpLmNvZGUpO1xuXG5jb25zdCBwYWNrYWdlUGF0aCA9IHBhdGguam9pbihwYXRoLnJlc29sdmUoJy4nKSwgJ3BhY2thZ2VzJywgJ3JvY2tldGNoYXQtbGl2ZWNoYXQnKTtcbmNvbnN0IHBsdWdpblBhdGggPSBwYXRoLmpvaW4ocGFja2FnZVBhdGgsICdwbHVnaW4nKTtcblxuY29uc3Qgb3B0aW9ucyA9IHtcblx0ZW52OiBwcm9jZXNzLmVudixcbn07XG5cbmlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG5cdGV4ZWNTeW5jKGAke3BsdWdpblBhdGh9L2J1aWxkLmJhdGAsIG9wdGlvbnMpO1xufSBlbHNlIHtcblx0ZXhlY1N5bmMoYHNoICR7cGx1Z2luUGF0aH0vYnVpbGQuc2hgLCBvcHRpb25zKTtcbn1cbiJdfQ==
