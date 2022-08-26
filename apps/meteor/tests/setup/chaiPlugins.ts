import chai from 'chai';
import chaiSpies from 'chai-spies';
import chaiDatetime from 'chai-datetime';
import chaiDom from 'chai-dom';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiSpies);
chai.use(chaiDatetime);
chai.use(chaiDom);
chai.use(chaiAsPromised);
