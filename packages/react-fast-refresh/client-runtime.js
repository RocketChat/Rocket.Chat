// const enabled = __meteor_runtime_config__.reactFastRefreshEnabled;

// if (enabled && process.env.NODE_ENV !== 'production' && module.hot) {
//   const runtime = require('react-refresh/runtime');

//   let timeout = null;
//   function scheduleRefresh() {
//     if (!timeout) {
//       timeout = setTimeout(() => {
//         timeout = null;
//         runtime.performReactRefresh();
//       }, 0);
//     }
//   }

//   // The react refresh babel plugin only registers functions. For react
//   // to update other types of exports (such as classes), we have to
//   // register them
//   function registerExportsForReactRefresh(moduleId, moduleExports) {
//     runtime.register(moduleExports, moduleId + ' %exports%');

//     if (moduleExports == null || typeof moduleExports !== 'object') {
//       // Exit if we can't iterate over exports.
//       return;
//     }

//     for (var key in moduleExports) {
//       var desc = Object.getOwnPropertyDescriptor(moduleExports, key);
//       if (desc && desc.get) {
//         // Don't invoke getters as they may have side effects.
//         continue;
//       }

//       var exportValue = moduleExports[key];
//       var typeID = moduleId + ' %exports% ' + key;
//       runtime.register(exportValue, typeID);
//     }
//   };

//   // Modules that only export components become React Refresh boundaries.
//   function isReactRefreshBoundary(moduleExports) {
//     if (runtime.isLikelyComponentType(moduleExports)) {
//       return true;
//     }
//     if (moduleExports == null || typeof moduleExports !== 'object') {
//       // Exit if we can't iterate over exports.
//       return false;
//     }

//     var hasExports = false;
//     var onlyExportComponents = true;

//     for (var key in moduleExports) {
//       hasExports = true;

//       var desc = Object.getOwnPropertyDescriptor(moduleExports, key);
//       if (desc && desc.get) {
//         // Don't invoke getters as they may have side effects.
//         return false;
//       }

//       if (!runtime.isLikelyComponentType(moduleExports[key])) {
//         onlyExportComponents = false;
//       }
//     }

//     return hasExports && onlyExportComponents;
//   };

//   runtime.injectIntoGlobalHook(window);

//   window.$RefreshReg$ = () => { };
//   window.$RefreshSig$ = () => type => type;

//   module.hot.onRequire({
//     before(module) {
//       if (module.loaded) {
//         // The module was already executed
//         return;
//       }

//       var prevRefreshReg = window.$RefreshReg$;
//       var prevRefreshSig = window.$RefreshSig$;

//       window.RefreshRuntime = runtime;
//       window.$RefreshReg$ = (type, _id) => {
//         const fullId = module.id + ' ' + _id;
//         RefreshRuntime.register(type, fullId);
//       }
//       window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;

//       return {
//         prevRefreshReg,
//         prevRefreshSig
//       };
//     },
//     after(module, beforeData) {
//       // TODO: handle modules with errors
//       if (!beforeData) {
//         return;
//       }

//       window.$RefreshReg$ = beforeData.prevRefreshReg;
//       window.$RefreshSig$ = beforeData.prevRefreshSig;
//       if (isReactRefreshBoundary(module.exports)) {
//         registerExportsForReactRefresh(module.id, module.exports);
//         module.hot.accept();

//         scheduleRefresh();
//       }
//     }
//   });
// }