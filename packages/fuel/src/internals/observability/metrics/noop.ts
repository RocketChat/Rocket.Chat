import { injectable } from '../../dependency-injection';
import type { IMetrics, IMetric, IMetricHistogram, IMetricGauge, IMetricCounter } from './definition';

class HistogramAdapter implements IMetricHistogram {
	public record(): void {
		// noop
	}
}

class GaugeAdapter implements IMetricGauge {
	public record(): void {
		// noop
	}
}

class CounterAdapter implements IMetricCounter {
	public add(): void {
		// noop
	}
}

class Metric implements IMetric {
	public createHistogram(): IMetricHistogram {
		return new HistogramAdapter();
	}

	public createGauge(): IMetricGauge {
		return new GaugeAdapter();
	}

	public createCounter(): IMetricCounter {
		return new CounterAdapter();
	}
}

@injectable()
export class NoopMetricsAdapter implements IMetrics {
	public createMetric(): IMetric {
		return new Metric();
	}
}
