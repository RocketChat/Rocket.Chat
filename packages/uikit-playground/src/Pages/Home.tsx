import { Box, Scrollable } from '@rocket.chat/fuselage';
import NavBar from '../Components/NavBar';
import HomeContainer from '../Components/HomeContainer/HomeContainer';

const Home = () => {
  return (
    <Box display={'flex'} flexDirection={'column'} w="100vw" h="100vh">
      <NavBar />
      <Scrollable>
        <HomeContainer />
      </Scrollable>
    </Box>
  );
};

export default Home;
