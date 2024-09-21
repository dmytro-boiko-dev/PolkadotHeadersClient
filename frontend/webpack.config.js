const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

module.exports = {
    mode: 'development', // Set the mode to development or production
    entry: './src/index.tsx', // Entry point of the application
    output: {
        filename: 'bundle.js', // Output file name
        path: path.resolve(__dirname, 'dist'), // Output directory
    },
    devtool: 'inline-source-map', // Source maps for easier debugging
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'), // Serve files from the 'dist' directory
        },
        port: 4000,            // port number for the backend server (hardcoded for the simplicity sake)
        open: true,            // automatically open the browser
        hot: true,             // enable hot module replacement
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'], // File extensions to handle
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,         // Match TypeScript files
                exclude: /node_modules/,
                use: 'babel-loader',         // Use Babel loader for transpiling
            },
            {
                test: /\.css$/,              // Match CSS files
                use: ['style-loader', 'css-loader'], // Use style and CSS loaders
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(), // Clean the output directory before each build
        new HtmlWebpackPlugin({
            template: './public/index.html', // Template HTML file
        }),
    ],
};
