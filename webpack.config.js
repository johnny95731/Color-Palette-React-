const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "production",
  performance: {
    hints: false,
    maxEntrypointSize: 102400,
    maxAssetSize: 102400,
  },
  entry: "./src/index",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "types": [
        path.resolve(__dirname, "src/features/types"),
        path.resolve(__dirname, "src/common/types")
      ].join(":"),
      "slices": path.resolve(__dirname, "src/features/slices"),
    },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json",],
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.(jsx?)$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env", "@babel/preset-react",
            ],
          },
        },
      },
      {
        test: /\.(tsx?)$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env", "@babel/preset-react", "@babel/typescript",
            ],
          },
        },
      },
      {
        test: /\.(s?css)$/,
        use: [
          {loader: MiniCssExtractPlugin.loader},
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[[local]__hash:base64:5]",
              },
            },
          },
          {loader: "postcss-loader"},
          {loader: "sass-loader"},
        ],
      },
      {
        test: /\.svg$/i,
        type: "asset",
        resourceQuery: /url/, // *.svg?url
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        resourceQuery: {not: [/url/]}, // exclude react component if *.svg?url
        use: ["@svgr/webpack"],
      },
    ], // rules end
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "index.css",
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      filename: "index.html",
      favicon: "./public/color-wheel.png",
    }),
  ],
};
