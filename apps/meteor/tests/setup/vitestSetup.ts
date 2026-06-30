import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiDatetime from 'chai-datetime';
import chaiDom from 'chai-dom';
import chaiSpies from 'chai-spies';

// Backend (node) unit tests keep using chai assertions + plugins, so we register the
// same plugins the Mocha setup used (chai-dom included — a few server specs use its
// `.value` assertion).
chai.use(chaiSpies);
chai.use(chaiDatetime);
chai.use(chaiDom);
chai.use(chaiAsPromised);
