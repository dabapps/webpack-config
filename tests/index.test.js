const path = require('path');
const createWebpackConfig = require('../src');

const CWD = process.cwd();

jest.mock('webpack', () => ({
  EnvironmentPlugin: jest.fn(),
}));
jest.mock('circular-dependency-plugin', () => ({
  CircularDependencyPlugin: jest.fn(),
}));
jest.mock('fork-ts-checker-webpack-plugin', () => ({
  ForkTsCheckerWebpackPlugin: jest.fn(),
}));

const { EnvironmentPlugin } = require('webpack');

describe('createWebpackConfig', () => {
  it('should be a function', () => {
    expect(typeof createWebpackConfig).toBe('function');
  });

  it('should return a webpack config object', () => {
    expect(typeof createWebpackConfig()).toBe('object');
  });

  it('should bundle a single entry', () => {
    const config = createWebpackConfig({
      input: 'src/index.ts',
      outDir: 'dist',
    });

    expect(config.entry).toEqual([
      'babel-polyfill',
      'raf/polyfill',
      path.resolve(CWD, 'src/index.ts'),
    ]);

    expect(config.output).toEqual({
      filename: 'bundle.js',
      path: path.resolve(CWD, 'dist'),
    });

    expect(config.resolve.alias).toEqual({
      '^': path.resolve(CWD, 'src/'),
    });
  });

  it('should bundle multiple entries', () => {
    const config = createWebpackConfig({
      input: {
        frontend: 'src/index.ts',
        admin: 'src/admin.js',
      },
      outDir: 'dist',
    });

    expect(config.entry).toEqual({
      frontend: [
        'babel-polyfill',
        'raf/polyfill',
        path.resolve(CWD, 'src/index.ts'),
      ],
      admin: [
        'babel-polyfill',
        'raf/polyfill',
        path.resolve(CWD, 'src/admin.ts'),
      ],
    });

    expect(config.output).toEqual({
      filename: '[name]-bundle.js',
      path: path.resolve(CWD, 'dist'),
    });

    expect(config.resolve.alias).toEqual({
      '^': path.resolve(CWD, 'src/'),
    });
  });

  it('should error if multiple entries are in different directories', () => {
    const unsureAboutAliases = () => createWebpackConfig({
      input: {
        frontend: 'src/index.ts',
        admin: 'admin/index.js',
      },
      outDir: 'dist',
    });

    expect(unsureAboutAliases).toThrow(/alias/);
  });

  it('should create a regex for raw files', () => {
    const config = createWebpackConfig({
      rawFileExtensions: ['html', 'txt', 'xml', 'csv'],
    });

    const rawLoaderRule = config.module.rules[0];

    expect(typeof rawLoaderRule).toBe('object');
    expect(rawLoaderRule.use).toBe('raw-loader');
    expect(rawLoaderRule.test).toEqual(/\.(?:html|txt|xml|csv)$/);
  });

  it('should set the tsconfig path', () => {
    const config = createWebpackConfig({
      tsconfig: 'tsconfig.json',
    });

    const tsLoaderRule = config.module.rules[1].use[1];

    expect(typeof tsLoaderRule).toBe('object');
    expect(tsLoaderRule.loader).toBe('ts-loader');
    expect(tsLoaderRule.options).toEqual({
      transpileOnly: true,
      configFile: path.resolve(CWD, 'tsconfig.json'),
    });
  });

  it('should set default environment variables', () => {
    createWebpackConfig({
      env: {
        NODE_ENV: 'production',
      },
    });

    expect(EnvironmentPlugin).toHaveBeenCalledWith({
      NODE_ENV: 'production',
    });
  });
});
