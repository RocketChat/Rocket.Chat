import type { ParserTracer, ParserOptions } from 'peggy';

export type Options = {
  colors?: boolean;
  emoticons?: boolean;
  katex?: {
    dollarSyntax?: boolean;
    parenthesisSyntax?: boolean;
  };
  customDomains?: string[];
};

type TracedOptions = ParserOptions & { ruleStack: string[] };

export class Tracer implements ParserTracer {
  constructor(private options: TracedOptions) {
    //
  }

  trace(event: any): void {
    if (event.type === 'rule.enter') {
      this.options.ruleStack.push(event.rule);
      return;
    }

    while (this.options.ruleStack.length > 0) {
      const lastRule =
        this.options.ruleStack[this.options.ruleStack.length - 1];

      if (
        lastRule !== event.rule &&
        !this.options.ruleStack.includes(event.rule)
      ) {
        break;
      }
      this.options.ruleStack.pop();

      if (lastRule === event.rule) {
        break;
      }
    }
  }

  public static createParserOptions(options?: Options): ParserOptions {
    const parserOptions: TracedOptions = {
      ...options,
      ruleStack: [],
    };

    parserOptions.tracer = new Tracer(parserOptions);
    return parserOptions;
  }
}
