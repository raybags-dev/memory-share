import { defaults as tsjPreset } from 'ts-jest/presets'
import { createTransformer } from 'babel-jest'
import babelOptions from './babel.config.mjs'

export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js?(x)'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  transform: {
    ...tsjPreset.transform,
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.(js|jsx)$': createTransformer(babelOptions)
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  }
}
