import { writeAll } from "https://deno.land/std@0.216.0/io/write_all.ts";
import { Queue } from "./messenger.ts";

export function collectMetrics() {
    return {
        pid: Deno.pid,
        queueSize: Queue.getCurrentSize(),
    }
};

const encoder = new TextEncoder();

export async function sendMetrics() {
    const metrics = collectMetrics();

    await writeAll(Deno.stderr, encoder.encode(JSON.stringify(metrics)));
}

let intervalId: number;

export function startMetricsReport(frequencyInMs = 5000) {
    if (intervalId) {
        throw new Error('There is already an active metrics report');
    }

    intervalId = setInterval(sendMetrics, frequencyInMs);
}

export function abortMetricsReport() {
    clearInterval(intervalId);
}
