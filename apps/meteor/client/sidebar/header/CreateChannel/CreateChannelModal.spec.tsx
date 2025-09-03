import CreateChannelModal from './CreateChannelModal';
import { testCreateChannelModal } from '../../../NavBarV2/NavBarPagesGroup/actions/testCreateChannelModal';

jest.mock('../../../lib/utils/goToRoomById', () => ({
	goToRoomById: jest.fn(),
}));

testCreateChannelModal(CreateChannelModal);
