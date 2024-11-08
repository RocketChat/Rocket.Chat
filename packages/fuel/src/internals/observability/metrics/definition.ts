export interface IMetricHistogram {
	record(params: {
		value: number;
		attributes?: Record<string, (string | number | boolean | Array<null | undefined | string>) | Date>;
	}): void;
}

export interface IMetricGauge {
	record(params: {
		value: number;
		attributes?: Record<string, (string | number | boolean | Array<null | undefined | string>) | Date>;
	}): void;
}

export interface IMetricCounter {
	add(params: { value: number; attributes?: Record<string, (string | number | boolean | Array<null | undefined | string>) | Date> }): void;
}

export interface IMetric {
	createHistogram(params: { name: string; description?: string; unit?: string }): IMetricHistogram;
	createGauge(params: { name: string; description?: string; unit?: string }): IMetricGauge;
	createCounter(params: { name: string; description?: string; unit?: string }): IMetricCounter;
}

export interface IMetrics {
	createMetric(name: string): IMetric;
}
