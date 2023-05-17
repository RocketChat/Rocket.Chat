import type { Configuration } from 'webpack';

const config: Configuration = {
  mode: 'development',
  module: {
    rules: [
      // JavaScript
      {
        test: /\.jsx?$/, // JavaScript and Reactive JavaScript
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // Transpiles ES6 JavaScript files
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },

      // TypeScript
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },

      // CSS
      {
        test: /\.css$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { import: 1 } },
          'postcss-loader',
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
};

export default config;
