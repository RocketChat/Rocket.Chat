import { parseArgs as $parseArgs } from "https://jsr.io/@std/cli/1.0.9/parse_args.ts";

export type ParsedArgs = {
    subprocess: string;
    spawnId: number;
    metricsReportFrequencyInMs?: number;
}

export function parseArgs(args: string[]): ParsedArgs {
    return $parseArgs(args);
}
