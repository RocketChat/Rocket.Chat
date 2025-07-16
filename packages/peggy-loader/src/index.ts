import type {
  BuildOptionsBase,
  OutputFormatAmdCommonjsEs,
  OutputFormatBare,
  OutputFormatGlobals,
  OutputFormatUmd,
  SourceOptionsBase,
} from 'peggy';
import peggy from 'peggy';
import type { Plugin } from 'vite';

type Options = BuildOptionsBase &
  (
    | Omit<
        OutputFormatAmdCommonjsEs<'source'>,
        keyof SourceOptionsBase<'source'>
      >
    | Omit<OutputFormatUmd<'source'>, keyof SourceOptionsBase<'source'>>
    | Omit<OutputFormatGlobals<'source'>, keyof SourceOptionsBase<'source'>>
    | Omit<OutputFormatBare<'source'>, keyof SourceOptionsBase<'source'>>
  );

const peggyPlugin = (options: Options = {}): Plugin => {
  return {
    name: 'vite-plugin-peggy',
    transform(code, id) {
      if (id.endsWith('.pegjs')) {
        //   return peggy.generate(code, {
        //     output: 'source',
        //     ...options,
        //   });
        // }
        return `export default ${peggy.generate(code, {
          output: 'source',
          ...options,
        })};`;
      }
    },
  };
};

export default peggyPlugin;
