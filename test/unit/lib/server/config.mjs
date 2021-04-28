import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import { getDefaultConfig } from '../../../../lib/server/config.mjs';

const config = getDefaultConfig();

////////////////////
// extendWithFile //
////////////////////

try {
  FileSystem.unlinkSync('tmp/test/foo');
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw error;
  }
}
Assert.throws(
  () => config.extendWithFile('tmp/test/foo', process.cwd()),
  /^Error: ENOENT/,
);

FileSystem.writeFileSync('tmp/test/foo', '123', 'utf8');
Assert.throws(
  () => config.extendWithFile('tmp/test/foo'),
  /^Error: invalid file extension/,
);

FileSystem.writeFileSync(
  'tmp/test/foo.json',
  JSON.stringify({ enabled: 'foo' }),
  'utf8',
);
Assert.throws(
  () => config.extendWithFile('tmp/test/foo.json'),
  /^Error: invalid configuration/,
);

FileSystem.writeFileSync(
  'tmp/test/foo.json',
  JSON.stringify({ enabled: true }),
  'utf8',
);
Assert.ok(config.extendWithFile('tmp/test/foo.json').data.enabled, true);

FileSystem.writeFileSync('tmp/test/foo.yml', 'enabled: true', 'utf8');
Assert.ok(config.extendWithFile('tmp/test/foo.yml').data.enabled, true);

/////////////////////
// extendsWithJson //
/////////////////////

Assert.throws(
  () => config.extendWithData({ extends: 'tmp/test/foo' }, null),
  /^Error: Missing base directory path/,
);

Assert.deepEqual(
  config.extendWithData({ 'git-dir': '.' }, process.cwd()).data.git,
  config.data.git,
);

Assert.deepEqual(
  config.extendWithData({ exclude: ['foo', 'bar'] }, process.cwd()).data
    .exclude,
  ['foo', 'bar'],
);

Assert.deepEqual(
  config.extendWithData(
    {
      packages: [
        'dist-or-path',
        {
          dist: 'dist',
        },
        {
          path: 'shallow-path',
          shallow: true,
        },
        {
          path: 'deep-path',
        },
      ],
    },
    '/foo',
  ).data.packages,
  [
    {
      shallow: false,
      path: '/foo/node_modules/dist-or-path',
      dist: 'dist-or-path',
      exclude: [],
    },
    {
      shallow: false,
      path: '/foo/node_modules/dist',
      dist: 'dist',
      exclude: [],
    },
    {
      shallow: false,
      path: '/foo/dist-or-path',
      dist: 'dist-or-path',
      exclude: [],
    },
    {
      shallow: true,
      path: '/foo/shallow-path',
      dist: null,
      exclude: [],
    },
    { shallow: false, path: '/foo/deep-path', dist: null, exclude: [] },
  ],
);

///////////////////
// extendWithEnv //
///////////////////

Assert.equal(
  config.extendWithEnv(
    {
      APPMAP: 'TruE',
      APPMAP_BAR: 'qux',
    },
    '/foo',
  ).data.enabled,
  true,
);

Assert.deepEqual(
  config.extendWithEnv(
    {
      APPMAP_PACKAGES: ' bar , qux ',
    },
    '/foo',
  ).data.packages,
  config.extendWithData(
    {
      packages: ['bar', 'qux'],
    },
    '/foo',
  ).data.packages,
);

/////////////
// Getters //
/////////////

Assert.equal(
  config
    .extendWithData({ 'escape-prefix': 'ESCAPE_PREFIX' }, null)
    .getEscapePrefix(),
  'ESCAPE_PREFIX',
);

Assert.equal(
  config.extendWithData({ 'app-name': 'APP_NAME' }, null).getAppName(),
  'APP_NAME',
);

Assert.equal(
  config.extendWithData({ 'map-name': 'MAP_NAME' }, null).getMapName(),
  'MAP_NAME',
);

Assert.equal(
  config.extendWithData({ 'output-dir': '/OUTPUT_DIR' }, null).getOutputDir(),
  '/OUTPUT_DIR',
);

Assert.equal(
  config
    .extendWithData({ 'language-version': '5.1' }, null)
    .getLanguageVersion(),
  '5.1',
);

{
  const metadata = config
    .extendWithData(
      {
        'map-name': 'MAP_NAME',
        labels: ['LABEL0', 'LABEL1'],
        'app-name': 'APP_NAME',
        feature: 'FEATURE',
        'feature-group': 'FEATURE_GROUP',
        'language-engine': 'LANGUAGE_ENGINE',
        'language-version': '5.1',
        frameworks: [
          {
            name: 'FRAMEWORKS-0-NAME',
            version: 'FRAMEWORKS-0-version',
          },
        ],
        'recorder-name': 'RECORDER_NAME',
        'recording-defined-class': 'RECORDING_DEFINED_CLASS',
        'recording-method-id': 'RECORDING_METHOD_ID',
      },
      null,
    )
    .getMetaData();
  Assert.ok(Reflect.getOwnPropertyDescriptor(metadata, 'git') !== undefined);
  delete metadata.git;
  Assert.ok(Reflect.getOwnPropertyDescriptor(metadata, 'client') !== undefined);
  Assert.ok(
    Reflect.getOwnPropertyDescriptor(metadata.client, 'version') !== undefined,
  );
  delete metadata.client.version;
  Assert.deepEqual(metadata, {
    name: 'MAP_NAME',
    labels: ['LABEL0', 'LABEL1'],
    app: 'APP_NAME',
    feature: 'FEATURE',
    feature_group: 'FEATURE_GROUP',
    language: {
      name: 'javascript',
      engine: 'LANGUAGE_ENGINE',
      version: '5.1',
    },
    frameworks: [
      {
        name: 'FRAMEWORKS-0-NAME',
        version: 'FRAMEWORKS-0-version',
      },
    ],
    client: {
      name: '@appland/appmap-agent-js',
      url: 'https://github.com/applandinc/appmap-agent-js.git',
    },
    recorder: {
      name: 'RECORDER_NAME',
    },
    recording: {
      defined_class: 'RECORDING_DEFINED_CLASS',
      method_id: 'RECORDING_METHOD_ID',
    },
  });
}

////////////////////////////
// getFileInstrumentation //
////////////////////////////

Assert.equal(
  config
    .extendWithData({ packages: ['bar'] }, '/foo')
    .getFileInstrumentation('/foo/bar'),
  null,
);

Assert.equal(
  config
    .extendWithData({ enabled: true }, '/foo')
    .getFileInstrumentation('/foo/bar'),
  null,
);

Assert.equal(
  config
    .extendWithData({ enabled: true, packages: ['bar'] }, '/foo')
    .getFileInstrumentation('bar'),
  null,
);

Assert.equal(
  config
    .extendWithData({ enabled: true, packages: ['bar'] }, '/foo')
    .getFileInstrumentation('/foo/bar'),
  'deep',
);

Assert.equal(
  config
    .extendWithData(
      { enabled: true, packages: [{ path: 'bar', shallow: true }] },
      '/foo',
    )
    .getFileInstrumentation('/foo/bar'),
  'shallow',
);

//////////////////////
// isNameExcluded //
//////////////////////

Assert.equal(config.isNameExcluded('/foo/bar', 'name'), true);

Assert.equal(
  config
    .extendWithData({ enabled: true }, '/foo')
    .isNameExcluded('/foo/bar', 'name'),
  true,
);

Assert.equal(
  config
    .extendWithData(
      { enabled: true, packages: ['bar'], exclude: ['name'] },
      '/foo',
    )
    .isNameExcluded('/foo/bar', 'name'),
  true,
);

Assert.equal(
  config
    .extendWithData(
      { enabled: true, packages: [{ path: 'bar', exclude: ['name'] }] },
      '/foo',
    )
    .isNameExcluded('/foo/bar', 'name'),
  true,
);

Assert.equal(
  config
    .extendWithData({ enabled: true, packages: ['bar'] }, '/foo')
    .isNameExcluded('/foo/bar', 'name'),
  false,
);
