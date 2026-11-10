import { Socket } from 'node:net';
import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { require } from '../../lib/require.ts';
import { sanitizeDeprecatedUsage } from '../../lib/sanitizeDeprecatedUsage.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';
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
  // deno-lint-ignore no-explicit-any
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
    // Normalize Node built-in specifiers: accept both 'crypto' and 'node:crypto'
    const normalized = module.replace('node:', '');
    if (ALLOWED_NATIVE_MODULES.includes(normalized)) {
      return require(`node:${normalized}`);
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
export default async function handleConstructApp(request) {
  const { params } = request;
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
  const app = new appClass(appPackage.info, request.context.logger, AppAccessorsInstance.getDefaultAppAccessors());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL2Rlbm8tcnVudGltZS9oYW5kbGVycy9hcHAvY29uc3RydWN0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNvY2tldCB9IGZyb20gJ25vZGU6bmV0JztcblxuaW1wb3J0IHR5cGUgeyBJUGFyc2VBcHBQYWNrYWdlUmVzdWx0IH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL3NlcnZlci9jb21waWxlci9JUGFyc2VBcHBQYWNrYWdlUmVzdWx0LnRzJztcblxuaW1wb3J0IHsgQXBwT2JqZWN0UmVnaXN0cnkgfSBmcm9tICcuLi8uLi9BcHBPYmplY3RSZWdpc3RyeS50cyc7XG5pbXBvcnQgeyByZXF1aXJlIH0gZnJvbSAnLi4vLi4vbGliL3JlcXVpcmUudHMnO1xuaW1wb3J0IHsgc2FuaXRpemVEZXByZWNhdGVkVXNhZ2UgfSBmcm9tICcuLi8uLi9saWIvc2FuaXRpemVEZXByZWNhdGVkVXNhZ2UudHMnO1xuaW1wb3J0IHsgQXBwQWNjZXNzb3JzSW5zdGFuY2UgfSBmcm9tICcuLi8uLi9saWIvYWNjZXNzb3JzL21vZC50cyc7XG5pbXBvcnQgeyBSZXF1ZXN0Q29udGV4dCB9IGZyb20gJy4uLy4uL2xpYi9yZXF1ZXN0Q29udGV4dC50cyc7XG5cbmNvbnN0IEFMTE9XRURfTkFUSVZFX01PRFVMRVMgPSBbJ3BhdGgnLCAndXJsJywgJ2NyeXB0bycsICdidWZmZXInLCAnc3RyZWFtJywgJ25ldCcsICdodHRwJywgJ2h0dHBzJywgJ3psaWInLCAndXRpbCcsICdwdW55Y29kZScsICdvcycsICdxdWVyeXN0cmluZycsICdmcyddO1xuY29uc3QgQUxMT1dFRF9FWFRFUk5BTF9NT0RVTEVTID0gWyd1dWlkJ107XG5cbmZ1bmN0aW9uIHByZXBhcmVFbnZpcm9ubWVudCgpIHtcblx0Ly8gRGVubyBkb2VzIG5vdCBiZWhhdmUgZXF1YWxseSB0byBOb2RlIHdoZW4gaXQgY29tZXMgdG8gcGlwaW5nIGNvbnRlbnQgdG8gYSBzb2NrZXRcblx0Ly8gU28gd2UgaW50ZXJ2ZW5lIGhlcmVcblx0Y29uc3Qgb3JpZ2luYWxGaW5hbCA9IFNvY2tldC5wcm90b3R5cGUuX2ZpbmFsO1xuXHQvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuXHRTb2NrZXQucHJvdG90eXBlLl9maW5hbCA9IGZ1bmN0aW9uIF9maW5hbChjYjogYW55KSB7XG5cdFx0Ly8gRGVubyBjbG9zZXMgdGhlIHJlYWRhYmxlIHN0cmVhbSBpbiB0aGUgU29ja2V0IGVhcmxpZXIgdGhhbiBOb2RlXG5cdFx0Ly8gVGhlIGV4YWN0IHJlYXNvbiBmb3IgdGhhdCBpcyB5ZXQgdW5rbm93biwgc28gd2UnbGwgbmVlZCB0byBzaW1wbHkgZGVsYXkgdGhlIGV4ZWN1dGlvblxuXHRcdC8vIHdoaWNoIGFsbG93cyBkYXRhIHRvIGJlIHJlYWQgaW4gYSByZXNwb25zZVxuXHRcdHNldFRpbWVvdXQoKCkgPT4gb3JpZ2luYWxGaW5hbC5jYWxsKHRoaXMsIGNiKSwgMSk7XG5cdH07XG59XG5cbi8vIEFzIHRoZSBhcHBzIGFyZSBidW5kbGVkLCB0aGUgb25seSB0aW1lcyB0aGV5IHdpbGwgY2FsbCByZXF1aXJlIGFyZVxuLy8gMS4gVG8gcmVxdWlyZSBuYXRpdmUgbW9kdWxlc1xuLy8gMi4gVG8gcmVxdWlyZSBleHRlcm5hbCBucG0gcGFja2FnZXMgd2UgbWF5IHByb3ZpZGVcbi8vIDMuIFRvIHJlcXVpcmUgYXBwcy1lbmdpbmUgZmlsZXNcbmZ1bmN0aW9uIGJ1aWxkUmVxdWlyZSgpOiAobW9kdWxlOiBzdHJpbmcpID0+IHVua25vd24ge1xuICAgIHJldHVybiAobW9kdWxlOiBzdHJpbmcpOiB1bmtub3duID0+IHtcbiAgICAgICAgLy8gTm9ybWFsaXplIE5vZGUgYnVpbHQtaW4gc3BlY2lmaWVyczogYWNjZXB0IGJvdGggJ2NyeXB0bycgYW5kICdub2RlOmNyeXB0bydcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IG1vZHVsZS5yZXBsYWNlKCdub2RlOicsICcnKTtcblxuICAgICAgICBpZiAoQUxMT1dFRF9OQVRJVkVfTU9EVUxFUy5pbmNsdWRlcyhub3JtYWxpemVkKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmUoYG5vZGU6JHtub3JtYWxpemVkfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEFMTE9XRURfRVhURVJOQUxfTU9EVUxFUy5pbmNsdWRlcyhtb2R1bGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVxdWlyZShgbnBtOiR7bW9kdWxlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1vZHVsZS5zdGFydHNXaXRoKCdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUnKSkge1xuICAgICAgICAgICAgLy8gT3VyIGByZXF1aXJlYCBmdW5jdGlvbiBrbm93cyBob3cgdG8gaGFuZGxlIHRoZXNlXG4gICAgICAgICAgICByZXR1cm4gcmVxdWlyZShtb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNb2R1bGUgJHttb2R1bGV9IGlzIG5vdCBhbGxvd2VkYCk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gd3JhcEFwcENvZGUoY29kZTogc3RyaW5nKTogKHJlcXVpcmU6IChtb2R1bGU6IHN0cmluZykgPT4gdW5rbm93bikgPT4gUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ge1xuXHRyZXR1cm4gbmV3IEZ1bmN0aW9uKFxuXHRcdCdyZXF1aXJlJyxcblx0XHRgXG4gICAgICAgIGNvbnN0IHsgQnVmZmVyIH0gPSByZXF1aXJlKCdidWZmZXInKTtcbiAgICAgICAgY29uc3QgZXhwb3J0cyA9IHt9O1xuICAgICAgICBjb25zdCBtb2R1bGUgPSB7IGV4cG9ydHMgfTtcbiAgICAgICAgY29uc3QgX2Vycm9yID0gY29uc29sZS5lcnJvci5iaW5kKGNvbnNvbGUpO1xuICAgICAgICBjb25zdCBfY29uc29sZSA9IHtcbiAgICAgICAgICAgIGxvZzogX2Vycm9yLFxuICAgICAgICAgICAgZXJyb3I6IF9lcnJvcixcbiAgICAgICAgICAgIGRlYnVnOiBfZXJyb3IsXG4gICAgICAgICAgICBpbmZvOiBfZXJyb3IsXG4gICAgICAgICAgICB3YXJuOiBfZXJyb3IsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gKGFzeW5jIChleHBvcnRzLG1vZHVsZSxyZXF1aXJlLEJ1ZmZlcixjb25zb2xlLGdsb2JhbFRoaXMsRGVubykgPT4ge1xuICAgICAgICAgICAgJHtjb2RlfTtcbiAgICAgICAgfSkoZXhwb3J0cyxtb2R1bGUscmVxdWlyZSxCdWZmZXIsX2NvbnNvbGUsdW5kZWZpbmVkLHVuZGVmaW5lZCk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdC50aGVuKCgpID0+IG1vZHVsZS5leHBvcnRzKTtgLFxuXHQpIGFzIChyZXF1aXJlOiAobW9kdWxlOiBzdHJpbmcpID0+IHVua25vd24pID0+IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+O1xufVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVDb25zdHJ1Y3RBcHAocmVxdWVzdDogUmVxdWVzdENvbnRleHQpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0Y29uc3QgeyBwYXJhbXMgfSA9IHJlcXVlc3Q7XG5cblx0aWYgKCFBcnJheS5pc0FycmF5KHBhcmFtcykpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGFyYW1zJywgeyBjYXVzZTogJ2ludmFsaWRfcGFyYW1fdHlwZScgfSk7XG5cdH1cblxuXHRjb25zdCBbYXBwUGFja2FnZV0gPSBwYXJhbXMgYXMgW0lQYXJzZUFwcFBhY2thZ2VSZXN1bHRdO1xuXG5cdGlmICghYXBwUGFja2FnZT8uaW5mbz8uaWQgfHwgIWFwcFBhY2thZ2U/LmluZm8/LmNsYXNzRmlsZSB8fCAhYXBwUGFja2FnZT8uZmlsZXMpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGFyYW1zJywgeyBjYXVzZTogJ2ludmFsaWRfcGFyYW1fdHlwZScgfSk7XG5cdH1cblxuXHRwcmVwYXJlRW52aXJvbm1lbnQoKTtcblxuXHRBcHBPYmplY3RSZWdpc3RyeS5zZXQoJ2lkJywgYXBwUGFja2FnZS5pbmZvLmlkKTtcblx0Y29uc3Qgc291cmNlID0gc2FuaXRpemVEZXByZWNhdGVkVXNhZ2UoYXBwUGFja2FnZS5maWxlc1thcHBQYWNrYWdlLmluZm8uY2xhc3NGaWxlXSk7XG5cblx0Y29uc3QgcmVxdWlyZSA9IGJ1aWxkUmVxdWlyZSgpO1xuXHRjb25zdCBleHBvcnRzID0gYXdhaXQgd3JhcEFwcENvZGUoc291cmNlKShyZXF1aXJlKTtcblxuXHQvLyBUaGlzIGlzIHRoZSBzYW1lIG5haXZlIGxvZ2ljIHdlJ3ZlIGJlZW4gdXNpbmcgaW4gdGhlIEFwcCBDb21waWxlclxuXHQvLyBBcHBseWluZyB0aGUgY29ycmVjdCB0eXBlIGhlcmUgaXMgcXVpdGUgZGlmZmljdWx0IGJlY2F1c2Ugb2YgdGhlIGR5bmFtaWMgbmF0dXJlIG9mIHRoZSBjb2RlXG5cdC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5cdGNvbnN0IGFwcENsYXNzID0gT2JqZWN0LnZhbHVlcyhleHBvcnRzKVswXSBhcyBhbnk7XG5cblx0Y29uc3QgYXBwID0gbmV3IGFwcENsYXNzKGFwcFBhY2thZ2UuaW5mbywgcmVxdWVzdC5jb250ZXh0LmxvZ2dlciwgQXBwQWNjZXNzb3JzSW5zdGFuY2UuZ2V0RGVmYXVsdEFwcEFjY2Vzc29ycygpKTtcblxuXHRpZiAodHlwZW9mIGFwcC5nZXROYW1lICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdBcHAgbXVzdCBjb250YWluIGEgZ2V0TmFtZSBmdW5jdGlvbicpO1xuXHR9XG5cblx0aWYgKHR5cGVvZiBhcHAuZ2V0TmFtZVNsdWcgIT09ICdmdW5jdGlvbicpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0FwcCBtdXN0IGNvbnRhaW4gYSBnZXROYW1lU2x1ZyBmdW5jdGlvbicpO1xuXHR9XG5cblx0aWYgKHR5cGVvZiBhcHAuZ2V0VmVyc2lvbiAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdHRocm93IG5ldyBFcnJvcignQXBwIG11c3QgY29udGFpbiBhIGdldFZlcnNpb24gZnVuY3Rpb24nKTtcblx0fVxuXG5cdGlmICh0eXBlb2YgYXBwLmdldElEICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdBcHAgbXVzdCBjb250YWluIGEgZ2V0SUQgZnVuY3Rpb24nKTtcblx0fVxuXG5cdGlmICh0eXBlb2YgYXBwLmdldERlc2NyaXB0aW9uICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdBcHAgbXVzdCBjb250YWluIGEgZ2V0RGVzY3JpcHRpb24gZnVuY3Rpb24nKTtcblx0fVxuXG5cdGlmICh0eXBlb2YgYXBwLmdldFJlcXVpcmVkQXBpVmVyc2lvbiAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdHRocm93IG5ldyBFcnJvcignQXBwIG11c3QgY29udGFpbiBhIGdldFJlcXVpcmVkQXBpVmVyc2lvbiBmdW5jdGlvbicpO1xuXHR9XG5cblx0QXBwT2JqZWN0UmVnaXN0cnkuc2V0KCdhcHAnLCBhcHApO1xuXG5cdHJldHVybiB0cnVlO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsTUFBTSxRQUFRLFdBQVc7QUFJbEMsU0FBUyxpQkFBaUIsUUFBUSw2QkFBNkI7QUFDL0QsU0FBUyxPQUFPLFFBQVEsdUJBQXVCO0FBQy9DLFNBQVMsdUJBQXVCLFFBQVEsdUNBQXVDO0FBQy9FLFNBQVMsb0JBQW9CLFFBQVEsNkJBQTZCO0FBR2xFLE1BQU0seUJBQXlCO0VBQUM7RUFBUTtFQUFPO0VBQVU7RUFBVTtFQUFVO0VBQU87RUFBUTtFQUFTO0VBQVE7RUFBUTtFQUFZO0VBQU07RUFBZTtDQUFLO0FBQzNKLE1BQU0sMkJBQTJCO0VBQUM7Q0FBTztBQUV6QyxTQUFTO0VBQ1IsbUZBQW1GO0VBQ25GLHVC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
// denoCacheMetadata=12473292784362855757,9089463141397337356