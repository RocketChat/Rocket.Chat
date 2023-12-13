// tracer.ts
import tracer from 'dd-trace';

tracer.init({
	logInjection: true,
	profiling: true,
	env: 'prod',
	service: 'rocket.chat',
}); // initialized in a different file to avoid hoisting.

tracer.dogstatsd.increment('custom.event');

export default tracer;
