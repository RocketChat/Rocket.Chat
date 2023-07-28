import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiDatetime from 'chai-datetime';
import chaiSpies from 'chai-spies';

chai.use(chaiSpies);
chai.use(chaiDatetime);
chai.use(chaiAsPromised);
