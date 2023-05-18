const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => [{
  mode: 'development',
	resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.(ts)x?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              noEmit: false,
            },
          }
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
					'css-loader',
          'postcss-loader',
        ],
      },
    ],
  },
	entry: path.resolve(__dirname, './src/index.tsx'),
	output: {
		path: path.resolve(__dirname, './dist'),
		filename: '[name].js',
	},
	plugins: [
		new HtmlWebpackPlugin({
			title: 'UiKit-Playground',
		}),
	],
}];
