const path = require('path');

module.exports = {
  resolve: {
    extensions: ['.js', '.jsx', '.ts'],
    alias: {
      views: path.resolve(__dirname, 'src/views/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      
    ],
  },
};
