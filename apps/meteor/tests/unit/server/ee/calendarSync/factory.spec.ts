import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const loadFactory = (settingsValues: Record<string, unknown>) => {
	const graphConstructor = sinon.stub();
	const factory = proxyquire.noCallThru().load('../../../../../ee/server/lib/calendarSync/factory.ts', {
		'../../../../server/settings': { settings: { get: (id: string) => settingsValues[id] } },
		'@rocket.chat/server-fetch': { serverFetch: sinon.stub() },
		'./providers/graph/MicrosoftGraphCalendarProvider': {
			MicrosoftGraphCalendarProvider: class {
				constructor(config: unknown) {
					graphConstructor(config);
				}
			},
		},
	});
	return { getConfiguredProvider: factory.getConfiguredProvider, graphConstructor };
};

const GRAPH_BASE = {
	CalendarSync_Provider: 'microsoft-graph',
	CalendarSync_Graph_TenantId: 'tenant-1',
	CalendarSync_Graph_ClientId: 'client-1',
	CalendarSync_Graph_Auth_Method: 'client-secret',
	CalendarSync_Graph_ClientSecret: 'secret-1',
	CalendarSync_Graph_Cloud: 'commercial',
};

describe('calendarSync/factory (graph)', () => {
	it('should build the Graph provider with commercial-cloud hosts by default', () => {
		const { getConfiguredProvider, graphConstructor } = loadFactory(GRAPH_BASE);

		expect(getConfiguredProvider()).to.not.be.null;
		const config = graphConstructor.firstCall.args[0];
		expect(config.loginHost).to.equal('https://login.microsoftonline.com');
		expect(config.graphHost).to.equal('https://graph.microsoft.com');
		expect(config.clientSecret).to.equal('secret-1');
	});

	it('should use Azure Government hosts for GCC High and DoD', () => {
		const gccHigh = loadFactory({ ...GRAPH_BASE, CalendarSync_Graph_Cloud: 'gcc-high' });
		gccHigh.getConfiguredProvider();
		expect(gccHigh.graphConstructor.firstCall.args[0].loginHost).to.equal('https://login.microsoftonline.us');
		expect(gccHigh.graphConstructor.firstCall.args[0].graphHost).to.equal('https://graph.microsoft.us');

		const dod = loadFactory({ ...GRAPH_BASE, CalendarSync_Graph_Cloud: 'dod' });
		dod.getConfiguredProvider();
		expect(dod.graphConstructor.firstCall.args[0].graphHost).to.equal('https://dod-graph.microsoft.us');
	});

	it('should pass certificate credentials through and require both parts', () => {
		const certSettings = {
			...GRAPH_BASE,
			CalendarSync_Graph_Auth_Method: 'certificate',
			CalendarSync_Graph_ClientSecret: '',
			CalendarSync_Graph_Certificate: 'CERT-PEM',
			CalendarSync_Graph_PrivateKey: 'KEY-PEM',
		};

		const complete = loadFactory(certSettings);
		expect(complete.getConfiguredProvider()).to.not.be.null;
		const config = complete.graphConstructor.firstCall.args[0];
		expect(config.authMethod).to.equal('certificate');
		expect(config.certificatePem).to.equal('CERT-PEM');
		expect(config.privateKeyPem).to.equal('KEY-PEM');
		expect(config.clientSecret).to.be.undefined;

		const missingKey = loadFactory({ ...certSettings, CalendarSync_Graph_PrivateKey: '' });
		expect(missingKey.getConfiguredProvider()).to.be.null;
		expect(missingKey.graphConstructor.called).to.be.false;
	});

	it('should return null when client-secret auth lacks a secret', () => {
		const { getConfiguredProvider, graphConstructor } = loadFactory({ ...GRAPH_BASE, CalendarSync_Graph_ClientSecret: '' });
		expect(getConfiguredProvider()).to.be.null;
		expect(graphConstructor.called).to.be.false;
	});
});
