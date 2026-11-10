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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vdmFyL2ZvbGRlcnMvcHQvNnBqM3hjMzk3ZzkxZF9qa3F6eDdtbmp3MDAwMGduL1QvYXBwcy1lbmdpbmUtdGVtcC9kZW5vLXJ1bnRpbWUvaGFuZGxlcnMvYXBwL2NvbnN0cnVjdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTb2NrZXQgfSBmcm9tICdub2RlOm5ldCc7XG5cbmltcG9ydCB0eXBlIHsgSVBhcnNlQXBwUGFja2FnZVJlc3VsdCB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9zZXJ2ZXIvY29tcGlsZXIvSVBhcnNlQXBwUGFja2FnZVJlc3VsdC50cyc7XG5cbmltcG9ydCB7IEFwcE9iamVjdFJlZ2lzdHJ5IH0gZnJvbSAnLi4vLi4vQXBwT2JqZWN0UmVnaXN0cnkudHMnO1xuaW1wb3J0IHsgcmVxdWlyZSB9IGZyb20gJy4uLy4uL2xpYi9yZXF1aXJlLnRzJztcbmltcG9ydCB7IHNhbml0aXplRGVwcmVjYXRlZFVzYWdlIH0gZnJvbSAnLi4vLi4vbGliL3Nhbml0aXplRGVwcmVjYXRlZFVzYWdlLnRzJztcbmltcG9ydCB7IEFwcEFjY2Vzc29yc0luc3RhbmNlIH0gZnJvbSAnLi4vLi4vbGliL2FjY2Vzc29ycy9tb2QudHMnO1xuaW1wb3J0IHsgUmVxdWVzdENvbnRleHQgfSBmcm9tICcuLi8uLi9saWIvcmVxdWVzdENvbnRleHQudHMnO1xuXG5jb25zdCBBTExPV0VEX05BVElWRV9NT0RVTEVTID0gWydwYXRoJywgJ3VybCcsICdjcnlwdG8nLCAnYnVmZmVyJywgJ3N0cmVhbScsICduZXQnLCAnaHR0cCcsICdodHRwcycsICd6bGliJywgJ3V0aWwnLCAncHVueWNvZGUnLCAnb3MnLCAncXVlcnlzdHJpbmcnLCAnZnMnXTtcbmNvbnN0IEFMTE9XRURfRVhURVJOQUxfTU9EVUxFUyA9IFsndXVpZCddO1xuXG5mdW5jdGlvbiBwcmVwYXJlRW52aXJvbm1lbnQoKSB7XG5cdC8vIERlbm8gZG9lcyBub3QgYmVoYXZlIGVxdWFsbHkgdG8gTm9kZSB3aGVuIGl0IGNvbWVzIHRvIHBpcGluZyBjb250ZW50IHRvIGEgc29ja2V0XG5cdC8vIFNvIHdlIGludGVydmVuZSBoZXJlXG5cdGNvbnN0IG9yaWdpbmFsRmluYWwgPSBTb2NrZXQucHJvdG90eXBlLl9maW5hbDtcblx0Ly8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcblx0U29ja2V0LnByb3RvdHlwZS5fZmluYWwgPSBmdW5jdGlvbiBfZmluYWwoY2I6IGFueSkge1xuXHRcdC8vIERlbm8gY2xvc2VzIHRoZSByZWFkYWJsZSBzdHJlYW0gaW4gdGhlIFNvY2tldCBlYXJsaWVyIHRoYW4gTm9kZVxuXHRcdC8vIFRoZSBleGFjdCByZWFzb24gZm9yIHRoYXQgaXMgeWV0IHVua25vd24sIHNvIHdlJ2xsIG5lZWQgdG8gc2ltcGx5IGRlbGF5IHRoZSBleGVjdXRpb25cblx0XHQvLyB3aGljaCBhbGxvd3MgZGF0YSB0byBiZSByZWFkIGluIGEgcmVzcG9uc2Vcblx0XHRzZXRUaW1lb3V0KCgpID0+IG9yaWdpbmFsRmluYWwuY2FsbCh0aGlzLCBjYiksIDEpO1xuXHR9O1xufVxuXG4vLyBBcyB0aGUgYXBwcyBhcmUgYnVuZGxlZCwgdGhlIG9ubHkgdGltZXMgdGhleSB3aWxsIGNhbGwgcmVxdWlyZSBhcmVcbi8vIDEuIFRvIHJlcXVpcmUgbmF0aXZlIG1vZHVsZXNcbi8vIDIuIFRvIHJlcXVpcmUgZXh0ZXJuYWwgbnBtIHBhY2thZ2VzIHdlIG1heSBwcm92aWRlXG4vLyAzLiBUbyByZXF1aXJlIGFwcHMtZW5naW5lIGZpbGVzXG5mdW5jdGlvbiBidWlsZFJlcXVpcmUoKTogKG1vZHVsZTogc3RyaW5nKSA9PiB1bmtub3duIHtcbiAgICByZXR1cm4gKG1vZHVsZTogc3RyaW5nKTogdW5rbm93biA9PiB7XG4gICAgICAgIC8vIE5vcm1hbGl6ZSBOb2RlIGJ1aWx0LWluIHNwZWNpZmllcnM6IGFjY2VwdCBib3RoICdjcnlwdG8nIGFuZCAnbm9kZTpjcnlwdG8nXG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBtb2R1bGUucmVwbGFjZSgnbm9kZTonLCAnJyk7XG5cbiAgICAgICAgaWYgKEFMTE9XRURfTkFUSVZFX01PRFVMRVMuaW5jbHVkZXMobm9ybWFsaXplZCkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXF1aXJlKGBub2RlOiR7bm9ybWFsaXplZH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBTExPV0VEX0VYVEVSTkFMX01PRFVMRVMuaW5jbHVkZXMobW9kdWxlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmUoYG5wbToke21vZHVsZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtb2R1bGUuc3RhcnRzV2l0aCgnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lJykpIHtcbiAgICAgICAgICAgIC8vIE91ciBgcmVxdWlyZWAgZnVuY3Rpb24ga25vd3MgaG93IHRvIGhhbmRsZSB0aGVzZVxuICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmUobW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTW9kdWxlICR7bW9kdWxlfSBpcyBub3QgYWxsb3dlZGApO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHdyYXBBcHBDb2RlKGNvZGU6IHN0cmluZyk6IChyZXF1aXJlOiAobW9kdWxlOiBzdHJpbmcpID0+IHVua25vd24pID0+IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+IHtcblx0cmV0dXJuIG5ldyBGdW5jdGlvbihcblx0XHQncmVxdWlyZScsXG5cdFx0YFxuICAgICAgICBjb25zdCB7IEJ1ZmZlciB9ID0gcmVxdWlyZSgnYnVmZmVyJyk7XG4gICAgICAgIGNvbnN0IGV4cG9ydHMgPSB7fTtcbiAgICAgICAgY29uc3QgbW9kdWxlID0geyBleHBvcnRzIH07XG4gICAgICAgIGNvbnN0IF9lcnJvciA9IGNvbnNvbGUuZXJyb3IuYmluZChjb25zb2xlKTtcbiAgICAgICAgY29uc3QgX2NvbnNvbGUgPSB7XG4gICAgICAgICAgICBsb2c6IF9lcnJvcixcbiAgICAgICAgICAgIGVycm9yOiBfZXJyb3IsXG4gICAgICAgICAgICBkZWJ1ZzogX2Vycm9yLFxuICAgICAgICAgICAgaW5mbzogX2Vycm9yLFxuICAgICAgICAgICAgd2FybjogX2Vycm9yLFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IChhc3luYyAoZXhwb3J0cyxtb2R1bGUscmVxdWlyZSxCdWZmZXIsY29uc29sZSxnbG9iYWxUaGlzLERlbm8pID0+IHtcbiAgICAgICAgICAgICR7Y29kZX07XG4gICAgICAgIH0pKGV4cG9ydHMsbW9kdWxlLHJlcXVpcmUsQnVmZmVyLF9jb25zb2xlLHVuZGVmaW5lZCx1bmRlZmluZWQpO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQudGhlbigoKSA9PiBtb2R1bGUuZXhwb3J0cyk7YCxcblx0KSBhcyAocmVxdWlyZTogKG1vZHVsZTogc3RyaW5nKSA9PiB1bmtub3duKSA9PiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHVua25vd24+Pjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlQ29uc3RydWN0QXBwKHJlcXVlc3Q6IFJlcXVlc3RDb250ZXh0KTogUHJvbWlzZTxib29sZWFuPiB7XG5cdGNvbnN0IHsgcGFyYW1zIH0gPSByZXF1ZXN0O1xuXG5cdGlmICghQXJyYXkuaXNBcnJheShwYXJhbXMpKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhcmFtcycsIHsgY2F1c2U6ICdpbnZhbGlkX3BhcmFtX3R5cGUnIH0pO1xuXHR9XG5cblx0Y29uc3QgW2FwcFBhY2thZ2VdID0gcGFyYW1zIGFzIFtJUGFyc2VBcHBQYWNrYWdlUmVzdWx0XTtcblxuXHRpZiAoIWFwcFBhY2thZ2U/LmluZm8/LmlkIHx8ICFhcHBQYWNrYWdlPy5pbmZvPy5jbGFzc0ZpbGUgfHwgIWFwcFBhY2thZ2U/LmZpbGVzKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhcmFtcycsIHsgY2F1c2U6ICdpbnZhbGlkX3BhcmFtX3R5cGUnIH0pO1xuXHR9XG5cblx0cHJlcGFyZUVudmlyb25tZW50KCk7XG5cblx0QXBwT2JqZWN0UmVnaXN0cnkuc2V0KCdpZCcsIGFwcFBhY2thZ2UuaW5mby5pZCk7XG5cdGNvbnN0IHNvdXJjZSA9IHNhbml0aXplRGVwcmVjYXRlZFVzYWdlKGFwcFBhY2thZ2UuZmlsZXNbYXBwUGFja2FnZS5pbmZvLmNsYXNzRmlsZV0pO1xuXG5cdGNvbnN0IHJlcXVpcmUgPSBidWlsZFJlcXVpcmUoKTtcblx0Y29uc3QgZXhwb3J0cyA9IGF3YWl0IHdyYXBBcHBDb2RlKHNvdXJjZSkocmVxdWlyZSk7XG5cblx0Ly8gVGhpcyBpcyB0aGUgc2FtZSBuYWl2ZSBsb2dpYyB3ZSd2ZSBiZWVuIHVzaW5nIGluIHRoZSBBcHAgQ29tcGlsZXJcblx0Ly8gQXBwbHlpbmcgdGhlIGNvcnJlY3QgdHlwZSBoZXJlIGlzIHF1aXRlIGRpZmZpY3VsdCBiZWNhdXNlIG9mIHRoZSBkeW5hbWljIG5hdHVyZSBvZiB0aGUgY29kZVxuXHQvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuXHRjb25zdCBhcHBDbGFzcyA9IE9iamVjdC52YWx1ZXMoZXhwb3J0cylbMF0gYXMgYW55O1xuXG5cdGNvbnN0IGFwcCA9IG5ldyBhcHBDbGFzcyhhcHBQYWNrYWdlLmluZm8sIHJlcXVlc3QuY29udGV4dC5sb2dnZXIsIEFwcEFjY2Vzc29yc0luc3RhbmNlLmdldERlZmF1bHRBcHBBY2Nlc3NvcnMoKSk7XG5cblx0aWYgKHR5cGVvZiBhcHAuZ2V0TmFtZSAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdHRocm93IG5ldyBFcnJvcignQXBwIG11c3QgY29udGFpbiBhIGdldE5hbWUgZnVuY3Rpb24nKTtcblx0fVxuXG5cdGlmICh0eXBlb2YgYXBwLmdldE5hbWVTbHVnICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdBcHAgbXVzdCBjb250YWluIGEgZ2V0TmFtZVNsdWcgZnVuY3Rpb24nKTtcblx0fVxuXG5cdGlmICh0eXBlb2YgYXBwLmdldFZlcnNpb24gIT09ICdmdW5jdGlvbicpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0FwcCBtdXN0IGNvbnRhaW4gYSBnZXRWZXJzaW9uIGZ1bmN0aW9uJyk7XG5cdH1cblxuXHRpZiAodHlwZW9mIGFwcC5nZXRJRCAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdHRocm93IG5ldyBFcnJvcignQXBwIG11c3QgY29udGFpbiBhIGdldElEIGZ1bmN0aW9uJyk7XG5cdH1cblxuXHRpZiAodHlwZW9mIGFwcC5nZXREZXNjcmlwdGlvbiAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdHRocm93IG5ldyBFcnJvcignQXBwIG11c3QgY29udGFpbiBhIGdldERlc2NyaXB0aW9uIGZ1bmN0aW9uJyk7XG5cdH1cblxuXHRpZiAodHlwZW9mIGFwcC5nZXRSZXF1aXJlZEFwaVZlcnNpb24gIT09ICdmdW5jdGlvbicpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0FwcCBtdXN0IGNvbnRhaW4gYSBnZXRSZXF1aXJlZEFwaVZlcnNpb24gZnVuY3Rpb24nKTtcblx0fVxuXG5cdEFwcE9iamVjdFJlZ2lzdHJ5LnNldCgnYXBwJywgYXBwKTtcblxuXHRyZXR1cm4gdHJ1ZTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLE1BQU0sUUFBUSxXQUFXO0FBSWxDLFNBQVMsaUJBQWlCLFFBQVEsNkJBQTZCO0FBQy9ELFNBQVMsT0FBTyxRQUFRLHVCQUF1QjtBQUMvQyxTQUFTLHVCQUF1QixRQUFRLHVDQUF1QztBQUMvRSxTQUFTLG9CQUFvQixRQUFRLDZCQUE2QjtBQUdsRSxNQUFNLHlCQUF5QjtFQUFDO0VBQVE7RUFBTztFQUFVO0VBQVU7RUFBVTtFQUFPO0VBQVE7RUFBUztFQUFRO0VBQVE7RUFBWTtFQUFNO0VBQWU7Q0FBSztBQUMzSixNQUFNLDJCQUEyQjtFQUFDO0NBQU87QUFFekMsU0FBUztFQUNSLG1GQUFtRjtF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
// denoCacheMetadata=12473292784362855757,12814948318615950246