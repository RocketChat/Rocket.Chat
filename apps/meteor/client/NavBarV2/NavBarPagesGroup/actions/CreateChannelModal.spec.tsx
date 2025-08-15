import { testCreateChannelModal } from './testCreateChannelModal';
import CreateChannelModalComponent from '../../../sidebar/header/CreateChannel';

jest.mock('../../../lib/utils/goToRoomById', () => ({
	goToRoomById: jest.fn(),
}));

testCreateChannelModal(CreateChannelModalComponent);
