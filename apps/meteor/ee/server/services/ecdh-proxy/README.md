# ECDH Proxy (alpha)

This services aims to be in front of the HTTP and Webscoket services and provide a second layer of encryption based on [ECDH](https://en.wikipedia.org/wiki/Elliptic-curve_Diffie%E2%80%93Hellman) algorithm.

## Configuration

All the configuration for this service is done via environment variables:

- **STATIC_SEED**: The static seed to compose the encryption. **Required**
- **PORT**: The port this service will expose the HTTP server. Default: `4000`
- **PROXY_HOST**: The host this service will proxy the requests to after decoding. Default `localhost`
- **PROXY_PORT**: The port this service will proxy the requests to after decoding. Default `3000`
