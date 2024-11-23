const path = require('path');

const config = (outputDeclarations = false) => ({
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, './tsconfig-bundle.json'),
            ...(!outputDeclarations && {
              compilerOptions: {
                declaration: false,
                declarationMap: undefined,
              },
            }),
          },
        },
        include: [path.resolve(__dirname, './src')],
        exclude: [path.resolve(__dirname, './tests')],
      },
      {
        test: /\.pegjs$/,
        use: ['babel-loader', '@rocket.chat/peggy-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.pegjs'],
  },
});

module.exports = [
  {
    ...config(),
    mode: 'development',
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'messageParser.development.js',
      library: {
        type: 'commonjs2',
      },
    },
  },
  {
    ...config(),
    mode: 'production',
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'messageParser.production.js',
      library: {
        type: 'commonjs2',
      },
    },
  },
  {
    ...config(),
    mode: 'production',
    experiments: {
      outputModule: true,
    },
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'messageParser.mjs',
      library: {
        type: 'module',
      },
    },
  },
  {
    ...config(true),
    mode: 'production',
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'messageParser.umd.js',
      library: {
        type: 'umd',
        name: 'RocketChatMessageParser',
        umdNamedDefine: true,
      },
      globalObject: 'this',
    },
  },
];
