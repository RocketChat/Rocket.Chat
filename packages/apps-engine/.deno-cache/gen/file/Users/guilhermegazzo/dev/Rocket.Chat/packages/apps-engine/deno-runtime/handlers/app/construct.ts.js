import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { require } from '../../lib/require.ts';
import { sanitizeDeprecatedUsage } from '../../lib/sanitizeDeprecatedUsage.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';
import { Socket } from 'node:net';
const ALLOWED_NATIVE_MODULES = [
  'path',
  'url',
  'crypto',
  'buffer',
  'stream',
  'net',
  'http',
  'https',
  'zlib',
  'util',
  'punycode',
  'os',
  'querystring',
  'fs'
];
const ALLOWED_EXTERNAL_MODULES = [
  'uuid'
];
function prepareEnvironment() {
  // Deno does not behave equally to Node when it comes to piping content to a socket
  // So we intervene here
  const originalFinal = Socket.prototype._final;
  Socket.prototype._final = function _final(cb) {
    // Deno closes the readable stream in the Socket earlier than Node
    // The exact reason for that is yet unknown, so we'll need to simply delay the execution
    // which allows data to be read in a response
    setTimeout(()=>originalFinal.call(this, cb), 1);
  };
}
// As the apps are bundled, the only times they will call require are
// 1. To require native modules
// 2. To require external npm packages we may provide
// 3. To require apps-engine files
function buildRequire() {
  return (module)=>{
    if (ALLOWED_NATIVE_MODULES.includes(module)) {
      return require(`node:${module}`);
    }
    if (ALLOWED_EXTERNAL_MODULES.includes(module)) {
      return require(`npm:${module}`);
    }
    if (module.startsWith('@rocket.chat/apps-engine')) {
      // Our `require` function knows how to handle these
      return require(module);
    }
    throw new Error(`Module ${module} is not allowed`);
  };
}
function wrapAppCode(code) {
  return new Function('require', `
        const { Buffer } = require('buffer');
        const exports = {};
        const module = { exports };
        const _error = console.error.bind(console);
        const _console = {
            log: _error,
            error: _error,
            debug: _error,
            info: _error,
            warn: _error,
        };

        const result = (async (exports,module,require,Buffer,console,globalThis,Deno) => {
            ${code};
        })(exports,module,require,Buffer,_console,undefined,undefined);

        return result.then(() => module.exports);`);
}
export default async function handleConstructApp(params) {
  if (!Array.isArray(params)) {
    throw new Error('Invalid params', {
      cause: 'invalid_param_type'
    });
  }
  const [appPackage] = params;
  if (!appPackage?.info?.id || !appPackage?.info?.classFile || !appPackage?.files) {
    throw new Error('Invalid params', {
      cause: 'invalid_param_type'
    });
  }
  prepareEnvironment();
  AppObjectRegistry.set('id', appPackage.info.id);
  const source = sanitizeDeprecatedUsage(appPackage.files[appPackage.info.classFile]);
  const require = buildRequire();
  const exports = await wrapAppCode(source)(require);
  // This is the same naive logic we've been using in the App Compiler
  // Applying the correct type here is quite difficult because of the dynamic nature of the code
  // deno-lint-ignore no-explicit-any
  const appClass = Object.values(exports)[0];
  const logger = AppObjectRegistry.get('logger');
  const app = new appClass(appPackage.info, logger, AppAccessorsInstance.getDefaultAppAccessors());
  if (typeof app.getName !== 'function') {
    throw new Error('App must contain a getName function');
  }
  if (typeof app.getNameSlug !== 'function') {
    throw new Error('App must contain a getNameSlug function');
  }
  if (typeof app.getVersion !== 'function') {
    throw new Error('App must contain a getVersion function');
  }
  if (typeof app.getID !== 'function') {
    throw new Error('App must contain a getID function');
  }
  if (typeof app.getDescription !== 'function') {
    throw new Error('App must contain a getDescription function');
  }
  if (typeof app.getRequiredApiVersion !== 'function') {
    throw new Error('App must contain a getRequiredApiVersion function');
  }
  AppObjectRegistry.set('app', app);
  return true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL2Rlbm8tcnVudGltZS9oYW5kbGVycy9hcHAvY29uc3RydWN0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgSVBhcnNlQXBwUGFja2FnZVJlc3VsdCB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9zZXJ2ZXIvY29tcGlsZXIvSVBhcnNlQXBwUGFja2FnZVJlc3VsdC50cyc7XG5cbmltcG9ydCB7IEFwcE9iamVjdFJlZ2lzdHJ5IH0gZnJvbSAnLi4vLi4vQXBwT2JqZWN0UmVnaXN0cnkudHMnO1xuaW1wb3J0IHsgcmVxdWlyZSB9IGZyb20gJy4uLy4uL2xpYi9yZXF1aXJlLnRzJztcbmltcG9ydCB7IHNhbml0aXplRGVwcmVjYXRlZFVzYWdlIH0gZnJvbSAnLi4vLi4vbGliL3Nhbml0aXplRGVwcmVjYXRlZFVzYWdlLnRzJztcbmltcG9ydCB7IEFwcEFjY2Vzc29yc0luc3RhbmNlIH0gZnJvbSAnLi4vLi4vbGliL2FjY2Vzc29ycy9tb2QudHMnO1xuaW1wb3J0IHsgU29ja2V0IH0gZnJvbSAnbm9kZTpuZXQnO1xuXG5jb25zdCBBTExPV0VEX05BVElWRV9NT0RVTEVTID0gWydwYXRoJywgJ3VybCcsICdjcnlwdG8nLCAnYnVmZmVyJywgJ3N0cmVhbScsICduZXQnLCAnaHR0cCcsICdodHRwcycsICd6bGliJywgJ3V0aWwnLCAncHVueWNvZGUnLCAnb3MnLCAncXVlcnlzdHJpbmcnLCAnZnMnXTtcbmNvbnN0IEFMTE9XRURfRVhURVJOQUxfTU9EVUxFUyA9IFsndXVpZCddO1xuXG5cbmZ1bmN0aW9uIHByZXBhcmVFbnZpcm9ubWVudCgpIHtcbiAgICAvLyBEZW5vIGRvZXMgbm90IGJlaGF2ZSBlcXVhbGx5IHRvIE5vZGUgd2hlbiBpdCBjb21lcyB0byBwaXBpbmcgY29udGVudCB0byBhIHNvY2tldFxuICAgIC8vIFNvIHdlIGludGVydmVuZSBoZXJlXG4gICAgY29uc3Qgb3JpZ2luYWxGaW5hbCA9IFNvY2tldC5wcm90b3R5cGUuX2ZpbmFsO1xuICAgIFNvY2tldC5wcm90b3R5cGUuX2ZpbmFsID0gZnVuY3Rpb24gX2ZpbmFsKGNiKSB7XG4gICAgICAgIC8vIERlbm8gY2xvc2VzIHRoZSByZWFkYWJsZSBzdHJlYW0gaW4gdGhlIFNvY2tldCBlYXJsaWVyIHRoYW4gTm9kZVxuICAgICAgICAvLyBUaGUgZXhhY3QgcmVhc29uIGZvciB0aGF0IGlzIHlldCB1bmtub3duLCBzbyB3ZSdsbCBuZWVkIHRvIHNpbXBseSBkZWxheSB0aGUgZXhlY3V0aW9uXG4gICAgICAgIC8vIHdoaWNoIGFsbG93cyBkYXRhIHRvIGJlIHJlYWQgaW4gYSByZXNwb25zZVxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IG9yaWdpbmFsRmluYWwuY2FsbCh0aGlzLCBjYiksIDEpO1xuICAgIH07XG59XG5cbi8vIEFzIHRoZSBhcHBzIGFyZSBidW5kbGVkLCB0aGUgb25seSB0aW1lcyB0aGV5IHdpbGwgY2FsbCByZXF1aXJlIGFyZVxuLy8gMS4gVG8gcmVxdWlyZSBuYXRpdmUgbW9kdWxlc1xuLy8gMi4gVG8gcmVxdWlyZSBleHRlcm5hbCBucG0gcGFja2FnZXMgd2UgbWF5IHByb3ZpZGVcbi8vIDMuIFRvIHJlcXVpcmUgYXBwcy1lbmdpbmUgZmlsZXNcbmZ1bmN0aW9uIGJ1aWxkUmVxdWlyZSgpOiAobW9kdWxlOiBzdHJpbmcpID0+IHVua25vd24ge1xuICAgIHJldHVybiAobW9kdWxlOiBzdHJpbmcpOiB1bmtub3duID0+IHtcbiAgICAgICAgaWYgKEFMTE9XRURfTkFUSVZFX01PRFVMRVMuaW5jbHVkZXMobW9kdWxlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmUoYG5vZGU6JHttb2R1bGV9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQUxMT1dFRF9FWFRFUk5BTF9NT0RVTEVTLmluY2x1ZGVzKG1vZHVsZSkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXF1aXJlKGBucG06JHttb2R1bGV9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobW9kdWxlLnN0YXJ0c1dpdGgoJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZScpKSB7XG4gICAgICAgICAgICAvLyBPdXIgYHJlcXVpcmVgIGZ1bmN0aW9uIGtub3dzIGhvdyB0byBoYW5kbGUgdGhlc2VcbiAgICAgICAgICAgIHJldHVybiByZXF1aXJlKG1vZHVsZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE1vZHVsZSAke21vZHVsZX0gaXMgbm90IGFsbG93ZWRgKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwQXBwQ29kZShjb2RlOiBzdHJpbmcpOiAocmVxdWlyZTogKG1vZHVsZTogc3RyaW5nKSA9PiB1bmtub3duKSA9PiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XG4gICAgcmV0dXJuIG5ldyBGdW5jdGlvbihcbiAgICAgICAgJ3JlcXVpcmUnLFxuICAgICAgICBgXG4gICAgICAgIGNvbnN0IHsgQnVmZmVyIH0gPSByZXF1aXJlKCdidWZmZXInKTtcbiAgICAgICAgY29uc3QgZXhwb3J0cyA9IHt9O1xuICAgICAgICBjb25zdCBtb2R1bGUgPSB7IGV4cG9ydHMgfTtcbiAgICAgICAgY29uc3QgX2Vycm9yID0gY29uc29sZS5lcnJvci5iaW5kKGNvbnNvbGUpO1xuICAgICAgICBjb25zdCBfY29uc29sZSA9IHtcbiAgICAgICAgICAgIGxvZzogX2Vycm9yLFxuICAgICAgICAgICAgZXJyb3I6IF9lcnJvcixcbiAgICAgICAgICAgIGRlYnVnOiBfZXJyb3IsXG4gICAgICAgICAgICBpbmZvOiBfZXJyb3IsXG4gICAgICAgICAgICB3YXJuOiBfZXJyb3IsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gKGFzeW5jIChleHBvcnRzLG1vZHVsZSxyZXF1aXJlLEJ1ZmZlcixjb25zb2xlLGdsb2JhbFRoaXMsRGVubykgPT4ge1xuICAgICAgICAgICAgJHtjb2RlfTtcbiAgICAgICAgfSkoZXhwb3J0cyxtb2R1bGUscmVxdWlyZSxCdWZmZXIsX2NvbnNvbGUsdW5kZWZpbmVkLHVuZGVmaW5lZCk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdC50aGVuKCgpID0+IG1vZHVsZS5leHBvcnRzKTtgLFxuICAgICkgYXMgKHJlcXVpcmU6IChtb2R1bGU6IHN0cmluZykgPT4gdW5rbm93bikgPT4gUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj47XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUNvbnN0cnVjdEFwcChwYXJhbXM6IHVua25vd24pOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocGFyYW1zKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGFyYW1zJywgeyBjYXVzZTogJ2ludmFsaWRfcGFyYW1fdHlwZScgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgW2FwcFBhY2thZ2VdID0gcGFyYW1zIGFzIFtJUGFyc2VBcHBQYWNrYWdlUmVzdWx0XTtcblxuICAgIGlmICghYXBwUGFja2FnZT8uaW5mbz8uaWQgfHwgIWFwcFBhY2thZ2U/LmluZm8/LmNsYXNzRmlsZSB8fCAhYXBwUGFja2FnZT8uZmlsZXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhcmFtcycsIHsgY2F1c2U6ICdpbnZhbGlkX3BhcmFtX3R5cGUnIH0pO1xuICAgIH1cblxuICAgIHByZXBhcmVFbnZpcm9ubWVudCgpO1xuXG4gICAgQXBwT2JqZWN0UmVnaXN0cnkuc2V0KCdpZCcsIGFwcFBhY2thZ2UuaW5mby5pZCk7XG4gICAgY29uc3Qgc291cmNlID0gc2FuaXRpemVEZXByZWNhdGVkVXNhZ2UoYXBwUGFja2FnZS5maWxlc1thcHBQYWNrYWdlLmluZm8uY2xhc3NGaWxlXSk7XG5cbiAgICBjb25zdCByZXF1aXJlID0gYnVpbGRSZXF1aXJlKCk7XG4gICAgY29uc3QgZXhwb3J0cyA9IGF3YWl0IHdyYXBBcHBDb2RlKHNvdXJjZSkocmVxdWlyZSk7XG5cbiAgICAvLyBUaGlzIGlzIHRoZSBzYW1lIG5haXZlIGxvZ2ljIHdlJ3ZlIGJlZW4gdXNpbmcgaW4gdGhlIEFwcCBDb21waWxlclxuICAgIC8vIEFwcGx5aW5nIHRoZSBjb3JyZWN0IHR5cGUgaGVyZSBpcyBxdWl0ZSBkaWZmaWN1bHQgYmVjYXVzZSBvZiB0aGUgZHluYW1pYyBuYXR1cmUgb2YgdGhlIGNvZGVcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIGNvbnN0IGFwcENsYXNzID0gT2JqZWN0LnZhbHVlcyhleHBvcnRzKVswXSBhcyBhbnk7XG4gICAgY29uc3QgbG9nZ2VyID0gQXBwT2JqZWN0UmVnaXN0cnkuZ2V0KCdsb2dnZXInKTtcblxuICAgIGNvbnN0IGFwcCA9IG5ldyBhcHBDbGFzcyhhcHBQYWNrYWdlLmluZm8sIGxvZ2dlciwgQXBwQWNjZXNzb3JzSW5zdGFuY2UuZ2V0RGVmYXVsdEFwcEFjY2Vzc29ycygpKTtcblxuICAgIGlmICh0eXBlb2YgYXBwLmdldE5hbWUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBcHAgbXVzdCBjb250YWluIGEgZ2V0TmFtZSBmdW5jdGlvbicpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgYXBwLmdldE5hbWVTbHVnICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQXBwIG11c3QgY29udGFpbiBhIGdldE5hbWVTbHVnIGZ1bmN0aW9uJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBhcHAuZ2V0VmVyc2lvbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FwcCBtdXN0IGNvbnRhaW4gYSBnZXRWZXJzaW9uIGZ1bmN0aW9uJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBhcHAuZ2V0SUQgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBcHAgbXVzdCBjb250YWluIGEgZ2V0SUQgZnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGFwcC5nZXREZXNjcmlwdGlvbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FwcCBtdXN0IGNvbnRhaW4gYSBnZXREZXNjcmlwdGlvbiBmdW5jdGlvbicpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgYXBwLmdldFJlcXVpcmVkQXBpVmVyc2lvbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FwcCBtdXN0IGNvbnRhaW4gYSBnZXRSZXF1aXJlZEFwaVZlcnNpb24gZnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICBBcHBPYmplY3RSZWdpc3RyeS5zZXQoJ2FwcCcsIGFwcCk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxTQUFTLGlCQUFpQixRQUFRLDZCQUE2QjtBQUMvRCxTQUFTLE9BQU8sUUFBUSx1QkFBdUI7QUFDL0MsU0FBUyx1QkFBdUIsUUFBUSx1Q0FBdUM7QUFDL0UsU0FBUyxvQkFBb0IsUUFBUSw2QkFBNkI7QUFDbEUsU0FBUyxNQUFNLFFBQVEsV0FBVztBQUVsQyxNQUFNLHlCQUF5QjtFQUFDO0VBQVE7RUFBTztFQUFVO0VBQVU7RUFBVTtFQUFPO0VBQVE7RUFBUztFQUFRO0VBQVE7RUFBWTtFQUFNO0VBQWU7Q0FBSztBQUMzSixNQUFNLDJCQUEyQjtFQUFDO0NBQU87QUFHekMsU0FBUztFQUNMLG1GQUFtRjtFQUNuRix1QkFBdUI7RUFDdkIsTUFBTSxnQkFBZ0IsT0FBTyxTQUFTLENBQUMsTUFBTTtFQUM3QyxPQUFPLFNBQVMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxPQUFPLEVBQUU7SUFDeEMsa0VBQWtFO0lBQ2xFLHdGQUF3RjtJQUN4Riw2Q0FBNkM7SUFDN0MsV0FBVyxJQUFNLGNBQWMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLO0VBQ25EO0FBQ0o7QUFFQSxxRUFBcUU7QUFDckUsK0JBQStCO0FBQy9CLHFEQUFxRDtBQUNyRCxrQ0FBa0M7QUFDbEMsU0FBUztFQUNMLE9BQU8sQ0FBQztJQUNKLElBQUksdUJBQXVCLFFBQVEsQ0FBQyxTQUFTO01BQ3pDLE9BQU8sUUFBUSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUM7SUFDbkM7SUFFQSxJQUFJLHlCQUF5QixRQUFRLENBQUMsU0FBUztNQUMzQyxPQUFPLFFBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDO0lBQ2xDO0lBRUEsSUFBSSxPQUFPLFVBQVUsQ0FBQyw2QkFBNkI7TUFDL0MsbURBQW1EO01BQ25ELE9BQU8sUUFBUTtJQUNuQjtJQUVBLE1BQU0sSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLE9BQU8sZUFBZSxDQUFDO0VBQ3JEO0FBQ0o7QUFFQSxTQUFTLFlBQVksSUFBWTtFQUM3QixPQUFPLElBQUksU0FDUCxXQUNBLENBQUM7Ozs7Ozs7Ozs7Ozs7O1lBY0csRUFBRSxLQUFLOzs7aURBRzhCLENBQUM7QUFFbEQ7QUFFQSxlQUFlLGVBQWUsbUJBQW1CLE1BQWU7RUFDNUQsSUFBSSxDQUFDLE1BQU0sT0FBTyxDQUFDLFNBQVM7SUFDeEIsTUFBTSxJQUFJLE1BQU0sa0JBQWtCO01BQUUsT0FBTztJQUFxQjtFQUNwRTtFQUVBLE1BQU0sQ0FBQyxXQUFXLEdBQUc7RUFFckIsSUFBSSxDQUFDLFlBQVksTUFBTSxNQUFNLENBQUMsWUFBWSxNQUFNLGFBQWEsQ0FBQyxZQUFZLE9BQU87SUFDN0UsTUFBTSxJQUFJLE1BQU0sa0JBQWtCO01BQUUsT0FBTztJQUFxQjtFQUNwRTtFQUVBO0VBRUEsa0JBQWtCLEdBQUcsQ0FBQyxNQUFNLFdBQVcsSUFBSSxDQUFDLEVBQUU7RUFDOUMsTUFBTSxTQUFTLHdCQUF3QixXQUFXLEtBQUssQ0FBQyxXQUFXLElBQUksQ0FBQyxTQUFTLENBQUM7RUFFbEYsTUFBTSxVQUFVO0VBQ2hCLE1BQU0sVUFBVSxNQUFNLFlBQVksUUFBUTtFQUUxQyxvRUFBb0U7RUFDcEUsOEZBQThGO0VBQzlGLG1DQUFtQztFQUNuQyxNQUFNLFdBQVcsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7RUFDMUMsTUFBTSxTQUFTLGtCQUFrQixHQUFHLENBQUM7RUFFckMsTUFBTSxNQUFNLElBQUksU0FBUyxXQUFXLElBQUksRUFBRSxRQUFRLHFCQUFxQixzQkFBc0I7RUFFN0YsSUFBSSxPQUFPLElBQUksT0FBTyxLQUFLLFlBQVk7SUFDbkMsTUFBTSxJQUFJLE1BQU07RUFDcEI7RUFFQSxJQUFJLE9BQU8sSUFBSSxXQUFXLEtBQUssWUFBWTtJQUN2QyxNQUFNLElBQUksTUFBTTtFQUNwQjtFQUVBLElBQUksT0FBTyxJQUFJLFVBQVUsS0FBSyxZQUFZO0lBQ3RDLE1BQU0sSUFBSSxNQUFNO0VBQ3BCO0VBRUEsSUFBSSxPQUFPLElBQUksS0FBSyxLQUFLLFlBQVk7SUFDakMsTUFBTSxJQUFJLE1BQU07RUFDcEI7RUFFQSxJQUFJLE9BQU8sSUFBSSxjQUFjLEtBQUssWUFBWTtJQUMxQyxNQUFNLElBQUksTUFBTTtFQUNwQjtFQUVBLElBQUksT0FBTyxJQUFJLHFCQUFxQixLQUFLLFlBQVk7SUFDakQsTUFBTSxJQUFJLE1BQU07RUFDcEI7RUFFQSxrQkFBa0IsR0FBRyxDQUFDLE9BQU87RUFFN0IsT0FBTztBQUNYIn0=