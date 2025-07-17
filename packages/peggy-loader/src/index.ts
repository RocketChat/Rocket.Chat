import type { SourceBuildOptions } from 'peggy';
import peggy from 'peggy';
import type { Plugin } from 'vite';

function peggyPlugin(options: SourceBuildOptions<'source-and-map'>): Plugin {
  return {
    name: 'vite-plugin-peggy',
    transform(code, id) {
      if (id.endsWith('.pegjs')) {
        const sourceNode = peggy.generate(code, {
          ...options,
          format: 'es',
          output: 'source-and-map',
          grammarSource: id,
        });
        const stringWithSourceMap = sourceNode.toStringWithSourceMap({
          file: id,
        });
        return {
          code: stringWithSourceMap.code,
          map: stringWithSourceMap.map.toJSON(),
        };
      }
    },
  };
}

export default peggyPlugin;
