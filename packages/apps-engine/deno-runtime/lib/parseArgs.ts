import { parseArgs as $parseArgs } from "@std/cli/parse-args";

export type ParsedArgs = {
    subprocess: string;
    spawnId: number;
    metricsReportFrequencyInMs?: number;
}

export function parseArgs(args: string[]): ParsedArgs {
    return $parseArgs(args);
}
