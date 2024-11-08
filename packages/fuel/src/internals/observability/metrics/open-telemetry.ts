import type { Counter, Gauge, Histogram } from '@opentelemetry/api';
import { metrics } from '@opentelemetry/api';
import type { Meter as IMeter } from '@opentelemetry/api/build/src/metrics/Meter';

import { injectable } from '../../dependency-injection';
import type { IMetrics, IMetric, IMetricHistogram, IMetricGauge, IMetricCounter } from './definition';

class HistogramAdapter implements IMetricHistogram {
	constructor(private histogram: Histogram) {}

	public record({
		value,
		attributes,
	}: {
		value: number;
		attributes?: Record<string, (string | number | boolean | Array<null | undefined | string>) | Date>;
	}): void {
		this.histogram.record(value, attributes as any);
	}
}

class GaugeAdapter implements IMetricGauge {
	constructor(private gauge: Gauge) {}

	public record({
		value,
		attributes,
	}: {
		value: number;
		attributes?: Record<string, (string | number | boolean | Array<null | undefined | string>) | Date>;
	}): void {
		this.gauge.record(value, attributes as any);
	}
}

class CounterAdapter implements IMetricCounter {
	constructor(private counter: Counter) {}

	public add({
		value,
		attributes,
	}: {
		value: number;
		attributes?: Record<string, (string | number | boolean | Array<null | undefined | string>) | Date>;
	}): void {
		if (value < 0) {
			throw new Error('Cannot count negative number');
		}
		this.counter.add(value, attributes as any);
	}
}

class Metric implements IMetric {
	constructor(private meter: IMeter) {}

	public createHistogram({ name, description, unit }: { name: string; description?: string; unit?: string }): IMetricHistogram {
		return new HistogramAdapter(this.meter.createHistogram(name, { description, unit }));
	}

	public createGauge({ name, description, unit }: { name: string; description?: string; unit?: string }): IMetricGauge {
		return new GaugeAdapter(this.meter.createGauge(name, { description, unit }));
	}

	public createCounter({ name, description, unit }: { name: string; description?: string; unit?: string }): IMetricCounter {
		return new CounterAdapter(this.meter.createCounter(name, { description, unit }));
	}
}

@injectable()
export class OpenTelemetryMetrics implements IMetrics {
	public createMetric(name: string): IMetric {
		return new Metric(metrics.getMeter(name));
	}
}
