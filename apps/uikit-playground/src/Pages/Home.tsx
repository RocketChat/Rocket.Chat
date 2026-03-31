import { Box, Scrollable } from '@rocket.chat/fuselage';
import HomeContainer from '../Components/HomeContainer/HomeContainer';

const Home = () => {
  return (
    <Box display={'flex'} flexDirection={'column'} w="100%" flexGrow={1}>
      <Scrollable>
        <HomeContainer />
      </Scrollable>
    </Box>
  );
};

export default Home;
