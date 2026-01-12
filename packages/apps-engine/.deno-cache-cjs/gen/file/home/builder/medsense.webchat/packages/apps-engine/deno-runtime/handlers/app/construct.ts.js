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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9idWlsZGVyL21lZHNlbnNlLndlYmNoYXQvcGFja2FnZXMvYXBwcy1lbmdpbmUvZGVuby1ydW50aW1lL2hhbmRsZXJzL2FwcC9jb25zdHJ1Y3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBJUGFyc2VBcHBQYWNrYWdlUmVzdWx0IH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL3NlcnZlci9jb21waWxlci9JUGFyc2VBcHBQYWNrYWdlUmVzdWx0LnRzJztcclxuXHJcbmltcG9ydCB7IEFwcE9iamVjdFJlZ2lzdHJ5IH0gZnJvbSAnLi4vLi4vQXBwT2JqZWN0UmVnaXN0cnkudHMnO1xyXG5pbXBvcnQgeyByZXF1aXJlIH0gZnJvbSAnLi4vLi4vbGliL3JlcXVpcmUudHMnO1xyXG5pbXBvcnQgeyBzYW5pdGl6ZURlcHJlY2F0ZWRVc2FnZSB9IGZyb20gJy4uLy4uL2xpYi9zYW5pdGl6ZURlcHJlY2F0ZWRVc2FnZS50cyc7XHJcbmltcG9ydCB7IEFwcEFjY2Vzc29yc0luc3RhbmNlIH0gZnJvbSAnLi4vLi4vbGliL2FjY2Vzc29ycy9tb2QudHMnO1xyXG5pbXBvcnQgeyBTb2NrZXQgfSBmcm9tICdub2RlOm5ldCc7XHJcblxyXG5jb25zdCBBTExPV0VEX05BVElWRV9NT0RVTEVTID0gWydwYXRoJywgJ3VybCcsICdjcnlwdG8nLCAnYnVmZmVyJywgJ3N0cmVhbScsICduZXQnLCAnaHR0cCcsICdodHRwcycsICd6bGliJywgJ3V0aWwnLCAncHVueWNvZGUnLCAnb3MnLCAncXVlcnlzdHJpbmcnLCAnZnMnXTtcclxuY29uc3QgQUxMT1dFRF9FWFRFUk5BTF9NT0RVTEVTID0gWyd1dWlkJ107XHJcblxyXG5mdW5jdGlvbiBwcmVwYXJlRW52aXJvbm1lbnQoKSB7XHJcblx0Ly8gRGVubyBkb2VzIG5vdCBiZWhhdmUgZXF1YWxseSB0byBOb2RlIHdoZW4gaXQgY29tZXMgdG8gcGlwaW5nIGNvbnRlbnQgdG8gYSBzb2NrZXRcclxuXHQvLyBTbyB3ZSBpbnRlcnZlbmUgaGVyZVxyXG5cdGNvbnN0IG9yaWdpbmFsRmluYWwgPSBTb2NrZXQucHJvdG90eXBlLl9maW5hbDtcclxuXHRTb2NrZXQucHJvdG90eXBlLl9maW5hbCA9IGZ1bmN0aW9uIF9maW5hbChjYikge1xyXG5cdFx0Ly8gRGVubyBjbG9zZXMgdGhlIHJlYWRhYmxlIHN0cmVhbSBpbiB0aGUgU29ja2V0IGVhcmxpZXIgdGhhbiBOb2RlXHJcblx0XHQvLyBUaGUgZXhhY3QgcmVhc29uIGZvciB0aGF0IGlzIHlldCB1bmtub3duLCBzbyB3ZSdsbCBuZWVkIHRvIHNpbXBseSBkZWxheSB0aGUgZXhlY3V0aW9uXHJcblx0XHQvLyB3aGljaCBhbGxvd3MgZGF0YSB0byBiZSByZWFkIGluIGEgcmVzcG9uc2VcclxuXHRcdHNldFRpbWVvdXQoKCkgPT4gb3JpZ2luYWxGaW5hbC5jYWxsKHRoaXMsIGNiKSwgMSk7XHJcblx0fTtcclxufVxyXG5cclxuLy8gQXMgdGhlIGFwcHMgYXJlIGJ1bmRsZWQsIHRoZSBvbmx5IHRpbWVzIHRoZXkgd2lsbCBjYWxsIHJlcXVpcmUgYXJlXHJcbi8vIDEuIFRvIHJlcXVpcmUgbmF0aXZlIG1vZHVsZXNcclxuLy8gMi4gVG8gcmVxdWlyZSBleHRlcm5hbCBucG0gcGFja2FnZXMgd2UgbWF5IHByb3ZpZGVcclxuLy8gMy4gVG8gcmVxdWlyZSBhcHBzLWVuZ2luZSBmaWxlc1xyXG5mdW5jdGlvbiBidWlsZFJlcXVpcmUoKTogKG1vZHVsZTogc3RyaW5nKSA9PiB1bmtub3duIHtcclxuICAgIHJldHVybiAobW9kdWxlOiBzdHJpbmcpOiB1bmtub3duID0+IHtcclxuICAgICAgICAvLyBOb3JtYWxpemUgTm9kZSBidWlsdC1pbiBzcGVjaWZpZXJzOiBhY2NlcHQgYm90aCAnY3J5cHRvJyBhbmQgJ25vZGU6Y3J5cHRvJ1xyXG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBtb2R1bGUucmVwbGFjZSgnbm9kZTonLCAnJyk7XHJcblxyXG4gICAgICAgIGlmIChBTExPV0VEX05BVElWRV9NT0RVTEVTLmluY2x1ZGVzKG5vcm1hbGl6ZWQpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXF1aXJlKGBub2RlOiR7bm9ybWFsaXplZH1gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChBTExPV0VEX0VYVEVSTkFMX01PRFVMRVMuaW5jbHVkZXMobW9kdWxlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVxdWlyZShgbnBtOiR7bW9kdWxlfWApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1vZHVsZS5zdGFydHNXaXRoKCdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUnKSkge1xyXG4gICAgICAgICAgICAvLyBPdXIgYHJlcXVpcmVgIGZ1bmN0aW9uIGtub3dzIGhvdyB0byBoYW5kbGUgdGhlc2VcclxuICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmUobW9kdWxlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTW9kdWxlICR7bW9kdWxlfSBpcyBub3QgYWxsb3dlZGApO1xyXG4gICAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gd3JhcEFwcENvZGUoY29kZTogc3RyaW5nKTogKHJlcXVpcmU6IChtb2R1bGU6IHN0cmluZykgPT4gdW5rbm93bikgPT4gUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ge1xyXG5cdHJldHVybiBuZXcgRnVuY3Rpb24oXHJcblx0XHQncmVxdWlyZScsXHJcblx0XHRgXHJcbiAgICAgICAgY29uc3QgeyBCdWZmZXIgfSA9IHJlcXVpcmUoJ2J1ZmZlcicpO1xyXG4gICAgICAgIGNvbnN0IGV4cG9ydHMgPSB7fTtcclxuICAgICAgICBjb25zdCBtb2R1bGUgPSB7IGV4cG9ydHMgfTtcclxuICAgICAgICBjb25zdCBfZXJyb3IgPSBjb25zb2xlLmVycm9yLmJpbmQoY29uc29sZSk7XHJcbiAgICAgICAgY29uc3QgX2NvbnNvbGUgPSB7XHJcbiAgICAgICAgICAgIGxvZzogX2Vycm9yLFxyXG4gICAgICAgICAgICBlcnJvcjogX2Vycm9yLFxyXG4gICAgICAgICAgICBkZWJ1ZzogX2Vycm9yLFxyXG4gICAgICAgICAgICBpbmZvOiBfZXJyb3IsXHJcbiAgICAgICAgICAgIHdhcm46IF9lcnJvcixcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCByZXN1bHQgPSAoYXN5bmMgKGV4cG9ydHMsbW9kdWxlLHJlcXVpcmUsQnVmZmVyLGNvbnNvbGUsZ2xvYmFsVGhpcyxEZW5vKSA9PiB7XHJcbiAgICAgICAgICAgICR7Y29kZX07XHJcbiAgICAgICAgfSkoZXhwb3J0cyxtb2R1bGUscmVxdWlyZSxCdWZmZXIsX2NvbnNvbGUsdW5kZWZpbmVkLHVuZGVmaW5lZCk7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQudGhlbigoKSA9PiBtb2R1bGUuZXhwb3J0cyk7YCxcclxuXHQpIGFzIChyZXF1aXJlOiAobW9kdWxlOiBzdHJpbmcpID0+IHVua25vd24pID0+IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVDb25zdHJ1Y3RBcHAocGFyYW1zOiB1bmtub3duKTogUHJvbWlzZTxib29sZWFuPiB7XHJcblx0aWYgKCFBcnJheS5pc0FycmF5KHBhcmFtcykpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXJhbXMnLCB7IGNhdXNlOiAnaW52YWxpZF9wYXJhbV90eXBlJyB9KTtcclxuXHR9XHJcblxyXG5cdGNvbnN0IFthcHBQYWNrYWdlXSA9IHBhcmFtcyBhcyBbSVBhcnNlQXBwUGFja2FnZVJlc3VsdF07XHJcblxyXG5cdGlmICghYXBwUGFja2FnZT8uaW5mbz8uaWQgfHwgIWFwcFBhY2thZ2U/LmluZm8/LmNsYXNzRmlsZSB8fCAhYXBwUGFja2FnZT8uZmlsZXMpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXJhbXMnLCB7IGNhdXNlOiAnaW52YWxpZF9wYXJhbV90eXBlJyB9KTtcclxuXHR9XHJcblxyXG5cdHByZXBhcmVFbnZpcm9ubWVudCgpO1xyXG5cclxuXHRBcHBPYmplY3RSZWdpc3RyeS5zZXQoJ2lkJywgYXBwUGFja2FnZS5pbmZvLmlkKTtcclxuXHRjb25zdCBzb3VyY2UgPSBzYW5pdGl6ZURlcHJlY2F0ZWRVc2FnZShhcHBQYWNrYWdlLmZpbGVzW2FwcFBhY2thZ2UuaW5mby5jbGFzc0ZpbGVdKTtcclxuXHJcblx0Y29uc3QgcmVxdWlyZSA9IGJ1aWxkUmVxdWlyZSgpO1xyXG5cdGNvbnN0IGV4cG9ydHMgPSBhd2FpdCB3cmFwQXBwQ29kZShzb3VyY2UpKHJlcXVpcmUpO1xyXG5cclxuXHQvLyBUaGlzIGlzIHRoZSBzYW1lIG5haXZlIGxvZ2ljIHdlJ3ZlIGJlZW4gdXNpbmcgaW4gdGhlIEFwcCBDb21waWxlclxyXG5cdC8vIEFwcGx5aW5nIHRoZSBjb3JyZWN0IHR5cGUgaGVyZSBpcyBxdWl0ZSBkaWZmaWN1bHQgYmVjYXVzZSBvZiB0aGUgZHluYW1pYyBuYXR1cmUgb2YgdGhlIGNvZGVcclxuXHQvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxyXG5cdGNvbnN0IGFwcENsYXNzID0gT2JqZWN0LnZhbHVlcyhleHBvcnRzKVswXSBhcyBhbnk7XHJcblx0Y29uc3QgbG9nZ2VyID0gQXBwT2JqZWN0UmVnaXN0cnkuZ2V0KCdsb2dnZXInKTtcclxuXHJcblx0Y29uc3QgYXBwID0gbmV3IGFwcENsYXNzKGFwcFBhY2thZ2UuaW5mbywgbG9nZ2VyLCBBcHBBY2Nlc3NvcnNJbnN0YW5jZS5nZXREZWZhdWx0QXBwQWNjZXNzb3JzKCkpO1xyXG5cclxuXHRpZiAodHlwZW9mIGFwcC5nZXROYW1lICE9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0FwcCBtdXN0IGNvbnRhaW4gYSBnZXROYW1lIGZ1bmN0aW9uJyk7XHJcblx0fVxyXG5cclxuXHRpZiAodHlwZW9mIGFwcC5nZXROYW1lU2x1ZyAhPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdBcHAgbXVzdCBjb250YWluIGEgZ2V0TmFtZVNsdWcgZnVuY3Rpb24nKTtcclxuXHR9XHJcblxyXG5cdGlmICh0eXBlb2YgYXBwLmdldFZlcnNpb24gIT09ICdmdW5jdGlvbicpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignQXBwIG11c3QgY29udGFpbiBhIGdldFZlcnNpb24gZnVuY3Rpb24nKTtcclxuXHR9XHJcblxyXG5cdGlmICh0eXBlb2YgYXBwLmdldElEICE9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0FwcCBtdXN0IGNvbnRhaW4gYSBnZXRJRCBmdW5jdGlvbicpO1xyXG5cdH1cclxuXHJcblx0aWYgKHR5cGVvZiBhcHAuZ2V0RGVzY3JpcHRpb24gIT09ICdmdW5jdGlvbicpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignQXBwIG11c3QgY29udGFpbiBhIGdldERlc2NyaXB0aW9uIGZ1bmN0aW9uJyk7XHJcblx0fVxyXG5cclxuXHRpZiAodHlwZW9mIGFwcC5nZXRSZXF1aXJlZEFwaVZlcnNpb24gIT09ICdmdW5jdGlvbicpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignQXBwIG11c3QgY29udGFpbiBhIGdldFJlcXVpcmVkQXBpVmVyc2lvbiBmdW5jdGlvbicpO1xyXG5cdH1cclxuXHJcblx0QXBwT2JqZWN0UmVnaXN0cnkuc2V0KCdhcHAnLCBhcHApO1xyXG5cclxuXHRyZXR1cm4gdHJ1ZTtcclxufVxyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsU0FBUyxpQkFBaUIsUUFBUSw2QkFBNkI7QUFDL0QsU0FBUyxPQUFPLFFBQVEsdUJBQXVCO0FBQy9DLFNBQVMsdUJBQXVCLFFBQVEsdUNBQXVDO0FBQy9FLFNBQVMsb0JBQW9CLFFBQVEsNkJBQTZCO0FBQ2xFLFNBQVMsTUFBTSxRQUFRLFdBQVc7QUFFbEMsTUFBTSx5QkFBeUI7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
// denoCacheMetadata=309692162351755764,16929759537315972220