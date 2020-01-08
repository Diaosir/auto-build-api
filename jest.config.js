module.exports = {
  "globals": {
    'ts-jest': {
      "tsConfig": 'tsconfig.jest.json',
      "diagnostics": true
    }
  },
  "preset": 'ts-jest',
  "testEnvironment": 'node',
  "moduleFileExtensions": [
    "js",
    "ts",
    "tsx",
    "json"
  ],
  "transform": {
    "^.+\\.ts?(x)$": "ts-jest",
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest'
  },
  "testMatch": [
    "<rootDir>/test/**/*(*.)@(spec|test).[tj]s?(x)",
    "<rootDir>/src/test/**/*(*.)@(spec|test).[tj]s?(x)"
  ]
};