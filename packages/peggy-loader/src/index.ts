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

type Options = BuildOptionsBase &
	(
		| Omit<OutputFormatAmdCommonjsEs<'source'>, keyof SourceOptionsBase<'source'>>
		| Omit<OutputFormatUmd<'source'>, keyof SourceOptionsBase<'source'>>
		| Omit<OutputFormatGlobals<'source'>, keyof SourceOptionsBase<'source'>>
		| Omit<OutputFormatBare<'source'>, keyof SourceOptionsBase<'source'>>
	);

function peggyLoader(this: LoaderContext<Options>, grammarContent: string): string {
	return peggy.generate(grammarContent, {
		output: 'source',
		format: 'es',
		...this.getOptions(),
	});
}

export default peggyLoader;
