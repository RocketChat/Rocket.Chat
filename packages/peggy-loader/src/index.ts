import type {
  BuildOptionsBase,
  OutputFormatAmdCommonjsEs,
  OutputFormatBare,
  OutputFormatGlobals,
  OutputFormatUmd,
  SourceOptionsBase,
} from 'peggy';
import peggy from 'peggy';
import type { LoaderContext } from 'webpack';

type Options =
  | BuildOptionsBase &
      (
        | Omit<
            OutputFormatAmdCommonjsEs<'source'>,
            keyof SourceOptionsBase<'source'>
          >
        | Omit<OutputFormatUmd<'source'>, keyof SourceOptionsBase<'source'>>
        | Omit<OutputFormatGlobals<'source'>, keyof SourceOptionsBase<'source'>>
        | Omit<OutputFormatBare<'source'>, keyof SourceOptionsBase<'source'>>
      );

function peggyLoader(
  this: LoaderContext<Options>,
  grammarContent: string
): string {
  const options: Options = {
    format: 'commonjs',
    ...this.getOptions(),
  };

  return peggy.generate(grammarContent, {
    output: 'source',
    ...options,
  });
}

export default peggyLoader;
