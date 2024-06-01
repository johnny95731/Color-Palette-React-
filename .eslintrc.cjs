module.exports = {
  "env": {
    "browser": true,
    "es2021": true,
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "project": "./tsconfig.json",
  },
  "plugins": [
    "react", "@typescript-eslint",
  ],
  "rules": {
    'linebreak-style': 'off',
    'quotes': ['error', 'single'],
    'object-curly-spacing': ['error', 'always'],
    'semi': ['error', 'always'],
    "react/prop-types": "off",
    "no-use-before-define": "off",
    "valid-jsdoc": "off",
    "require-jsdoc": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-use-before-define": [
      "error",
      {
        "functions": false, "classes": true, "variables": true,
        "typedefs": true,
      },
    ],
  },
};
