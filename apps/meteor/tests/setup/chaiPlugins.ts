import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiDatetime from 'chai-datetime';
import chaiDom from 'chai-dom';
import chaiSpies from 'chai-spies';

chai.use(chaiSpies);
chai.use(chaiDatetime);
chai.use(chaiDom);
chai.use(chaiAsPromised);
