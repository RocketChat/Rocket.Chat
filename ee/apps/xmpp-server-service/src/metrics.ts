import { monitorEventLoopDelay } from 'node:perf_hooks';

import type { InboundHandlerObserver } from '@rocket.chat/xmpp-server';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

const LOOP_DELAY_RESOLUTION_MS = 10;

const DURATION_BUCKETS = [0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30];

/** `counts` are cumulative per finite bucket; `total` also covers everything past the last one. */
export type HandlerDurationBuckets = { le: number[]; counts: number[]; total: number };

export type InboundStats = {
	/** Handlers never run in decode-only mode, so decoding is all the service does with an event. */
	decodeOnly: boolean;
	decoded: Record<string, number>;
	inflight: Record<string, number>;
	completed: Record<string, number>;
	failed: Record<string, number>;
	/** Kept as raw buckets so a client can compute percentiles over any window from two samples. */
	durations: Record<string, HandlerDurationBuckets>;
	/** Worst event-loop delay percentile since the previous /stats read. */
	eventLoopLagP99Ms: number;
	rssBytes: number;
};

/** Metrics that tell whether Rocket.Chat-side handling keeps up with inbound XMPP traffic. */
export function createInboundMetrics({ decodeOnly }: { decodeOnly: boolean }) {
	const registry = new Registry();
	collectDefaultMetrics({ register: registry });

	let readDecoded: () => Record<string, number> = () => ({});
	const decodedSeen = new Map<string, number>();

	new Counter({
		name: 'xmpp_inbound_decoded_total',
		help: 'Inbound XMPP events decoded by the protocol core',
		labelNames: ['event'],
		registers: [registry],
		collect() {
			for (const [event, total] of Object.entries(readDecoded())) {
				const delta = total - (decodedSeen.get(event) ?? 0);
				if (delta > 0) {
					this.inc({ event }, delta);
					decodedSeen.set(event, total);
				}
			}
		},
	});

	const inflight = new Gauge({
		name: 'xmpp_handler_inflight',
		help: 'Inbound XMPP events whose Rocket.Chat handling has started but not settled',
		labelNames: ['event'],
		registers: [registry],
	});

	const completed = new Counter({
		name: 'xmpp_handler_completed_total',
		help: 'Inbound XMPP events whose Rocket.Chat handling settled',
		labelNames: ['event', 'outcome'],
		registers: [registry],
	});

	const duration = new Histogram({
		name: 'xmpp_handler_duration_seconds',
		help: 'Time from decoding an inbound XMPP event to its Rocket.Chat handling settling',
		labelNames: ['event'],
		buckets: DURATION_BUCKETS,
		registers: [registry],
	});

	// Separate from the default-metrics histogram, which resets on every Prometheus scrape
	const loopDelay = monitorEventLoopDelay({ resolution: LOOP_DELAY_RESOLUTION_MS });
	loopDelay.enable();

	const observeHandler: InboundHandlerObserver = (event) => {
		inflight.inc({ event });
		const stopTimer = duration.startTimer({ event });
		return (outcome) => {
			inflight.dec({ event });
			completed.inc({ event, outcome });
			stopTimer();
		};
	};

	const stats = async (): Promise<InboundStats> => {
		const byEvent = (values: { labels: Record<string, string | number>; value: number }[]) =>
			Object.fromEntries(values.map(({ labels, value }) => [labels.event, value]));

		const completedValues = (await completed.get()).values;
		const durations: Record<string, HandlerDurationBuckets> = {};
		for (const { labels, value, metricName } of (await duration.get()).values) {
			// Bucket samples carry an `le` label that the declared label names do not include
			const { event, le } = labels as { event: string; le?: string | number };
			durations[event] ??= { le: [], counts: [], total: 0 };
			const entry = durations[event];
			if (metricName === 'xmpp_handler_duration_seconds_count') {
				entry.total = value;
			} else if (metricName === 'xmpp_handler_duration_seconds_bucket' && le !== '+Inf') {
				entry.le.push(Number(le));
				entry.counts.push(value);
			}
		}

		// The histogram counts the sampling interval itself as delay
		const eventLoopLagP99Ms = Math.max(0, loopDelay.percentile(99) / 1e6 - LOOP_DELAY_RESOLUTION_MS);
		loopDelay.reset();

		return {
			decodeOnly,
			decoded: readDecoded(),
			inflight: byEvent((await inflight.get()).values),
			completed: byEvent(completedValues.filter(({ labels }) => labels.outcome === 'ok')),
			failed: byEvent(completedValues.filter(({ labels }) => labels.outcome === 'error')),
			durations,
			eventLoopLagP99Ms,
			rssBytes: process.memoryUsage.rss(),
		};
	};

	return {
		registry,
		observeHandler,
		stats,
		/** The decoded totals live in the service, which is created after the observer it needs. */
		setDecodedSource(source: () => Record<string, number>) {
			readDecoded = source;
		},
	};
}
