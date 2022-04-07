(function () {

/* Imports */
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"Livechat":{"plugin":{"build-livechat.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/Livechat/plugin/build-livechat.js                                                                   //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
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
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"uglify-js":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// node_modules/meteor/Livechat/node_modules/uglify-js/package.json                                             //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
module.exports = {
  "name": "uglify-js",
  "version": "2.8.29",
  "main": "tools/node.js"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"tools":{"node.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// node_modules/meteor/Livechat/node_modules/uglify-js/tools/node.js                                            //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/Livechat/plugin/build-livechat.js");

/* Exports */
Package._define("Livechat");

})();

//# sourceURL=meteor://💻app/packages/Livechat_plugin.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvTGl2ZWNoYXQvcGx1Z2luL2J1aWxkLWxpdmVjaGF0LmpzIl0sIm5hbWVzIjpbInBhdGgiLCJtb2R1bGUiLCJsaW5rIiwiZGVmYXVsdCIsInYiLCJleGVjU3luYyIsImZzIiwiVWdsaWZ5SlMiLCJsaXZlY2hhdFNvdXJjZSIsInJlc29sdmUiLCJsaXZlY2hhdFRhcmdldCIsIndyaXRlRmlsZVN5bmMiLCJtaW5pZnkiLCJjb2RlIiwicGFja2FnZVBhdGgiLCJqb2luIiwicGx1Z2luUGF0aCIsIm9wdGlvbnMiLCJlbnYiLCJwcm9jZXNzIiwicGxhdGZvcm0iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLElBQUo7QUFBU0MsTUFBTSxDQUFDQyxJQUFQLENBQVksTUFBWixFQUFtQjtBQUFDQyxTQUFPLENBQUNDLENBQUQsRUFBRztBQUFDSixRQUFJLEdBQUNJLENBQUw7QUFBTzs7QUFBbkIsQ0FBbkIsRUFBd0MsQ0FBeEM7QUFBMkMsSUFBSUMsUUFBSjtBQUFhSixNQUFNLENBQUNDLElBQVAsQ0FBWSxlQUFaLEVBQTRCO0FBQUNHLFVBQVEsQ0FBQ0QsQ0FBRCxFQUFHO0FBQUNDLFlBQVEsR0FBQ0QsQ0FBVDtBQUFXOztBQUF4QixDQUE1QixFQUFzRCxDQUF0RDtBQUF5RCxJQUFJRSxFQUFKO0FBQU9MLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLElBQVosRUFBaUI7QUFBQ0MsU0FBTyxDQUFDQyxDQUFELEVBQUc7QUFBQ0UsTUFBRSxHQUFDRixDQUFIO0FBQUs7O0FBQWpCLENBQWpCLEVBQW9DLENBQXBDO0FBQXVDLElBQUlHLFFBQUo7QUFBYU4sTUFBTSxDQUFDQyxJQUFQLENBQVksV0FBWixFQUF3QjtBQUFDQyxTQUFPLENBQUNDLENBQUQsRUFBRztBQUFDRyxZQUFRLEdBQUNILENBQVQ7QUFBVzs7QUFBdkIsQ0FBeEIsRUFBaUQsQ0FBakQ7QUFNckwsTUFBTUksY0FBYyxHQUFHUixJQUFJLENBQUNTLE9BQUwsQ0FBYSxVQUFiLEVBQXlCLHFCQUF6QixFQUFnRCxRQUFoRCxFQUEwRCxvQkFBMUQsQ0FBdkI7QUFDQSxNQUFNQyxjQUFjLEdBQUdWLElBQUksQ0FBQ1MsT0FBTCxDQUFhLFVBQWIsRUFBeUIscUJBQXpCLEVBQWdELFFBQWhELEVBQTBELDRCQUExRCxDQUF2QjtBQUVBSCxFQUFFLENBQUNLLGFBQUgsQ0FBaUJELGNBQWpCLEVBQWlDSCxRQUFRLENBQUNLLE1BQVQsQ0FBZ0JKLGNBQWhCLEVBQWdDSyxJQUFqRTtBQUVBLE1BQU1DLFdBQVcsR0FBR2QsSUFBSSxDQUFDZSxJQUFMLENBQVVmLElBQUksQ0FBQ1MsT0FBTCxDQUFhLEdBQWIsQ0FBVixFQUE2QixVQUE3QixFQUF5QyxxQkFBekMsQ0FBcEI7QUFDQSxNQUFNTyxVQUFVLEdBQUdoQixJQUFJLENBQUNlLElBQUwsQ0FBVUQsV0FBVixFQUF1QixRQUF2QixDQUFuQjtBQUVBLE1BQU1HLE9BQU8sR0FBRztBQUNmQyxLQUFHLEVBQUVDLE9BQU8sQ0FBQ0Q7QUFERSxDQUFoQjs7QUFJQSxJQUFJQyxPQUFPLENBQUNDLFFBQVIsS0FBcUIsT0FBekIsRUFBa0M7QUFDakNmLFVBQVEsV0FBSVcsVUFBSixpQkFBNEJDLE9BQTVCLENBQVI7QUFDQSxDQUZELE1BRU87QUFDTlosVUFBUSxjQUFPVyxVQUFQLGdCQUE4QkMsT0FBOUIsQ0FBUjtBQUNBLEMiLCJmaWxlIjoiL3BhY2thZ2VzL0xpdmVjaGF0X3BsdWdpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5cbmltcG9ydCBVZ2xpZnlKUyBmcm9tICd1Z2xpZnktanMnO1xuXG5jb25zdCBsaXZlY2hhdFNvdXJjZSA9IHBhdGgucmVzb2x2ZSgncGFja2FnZXMnLCAncm9ja2V0Y2hhdC1saXZlY2hhdCcsICdhc3NldHMnLCAncm9ja2V0LWxpdmVjaGF0LmpzJyk7XG5jb25zdCBsaXZlY2hhdFRhcmdldCA9IHBhdGgucmVzb2x2ZSgncGFja2FnZXMnLCAncm9ja2V0Y2hhdC1saXZlY2hhdCcsICdhc3NldHMnLCAncm9ja2V0Y2hhdC1saXZlY2hhdC5taW4uanMnKTtcblxuZnMud3JpdGVGaWxlU3luYyhsaXZlY2hhdFRhcmdldCwgVWdsaWZ5SlMubWluaWZ5KGxpdmVjaGF0U291cmNlKS5jb2RlKTtcblxuY29uc3QgcGFja2FnZVBhdGggPSBwYXRoLmpvaW4ocGF0aC5yZXNvbHZlKCcuJyksICdwYWNrYWdlcycsICdyb2NrZXRjaGF0LWxpdmVjaGF0Jyk7XG5jb25zdCBwbHVnaW5QYXRoID0gcGF0aC5qb2luKHBhY2thZ2VQYXRoLCAncGx1Z2luJyk7XG5cbmNvbnN0IG9wdGlvbnMgPSB7XG5cdGVudjogcHJvY2Vzcy5lbnYsXG59O1xuXG5pZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuXHRleGVjU3luYyhgJHtwbHVnaW5QYXRofS9idWlsZC5iYXRgLCBvcHRpb25zKTtcbn0gZWxzZSB7XG5cdGV4ZWNTeW5jKGBzaCAke3BsdWdpblBhdGh9L2J1aWxkLnNoYCwgb3B0aW9ucyk7XG59XG4iXX0=
