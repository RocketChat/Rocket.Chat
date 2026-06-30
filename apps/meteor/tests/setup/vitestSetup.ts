import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiDatetime from 'chai-datetime';
import chaiSpies from 'chai-spies';

// Backend (node) unit tests keep using chai assertions + plugins, so we register
// the same plugins the Mocha setup used. `chai-dom` is intentionally omitted — it
// is not used by any server-side spec and only makes sense in a DOM environment.
chai.use(chaiSpies);
chai.use(chaiDatetime);
chai.use(chaiAsPromised);
