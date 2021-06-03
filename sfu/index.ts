import http from 'http';

const server = http.createServer();

const SFU_PORT = 8989;


server.listen(SFU_PORT, () => console.log(`SFU server started on PORT:${ SFU_PORT }`));
