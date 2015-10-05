#!/bin/sh

export DDP_DEFAULT_CONNECTION_URL=http://localhost:3000
export MONGO_URL=mongodb://localhost:3001
meteor -p 5000
