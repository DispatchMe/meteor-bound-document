Package.describe({
  name: 'dispatch:bound-document',
  summary: 'Bound documents',
  version: '0.0.1'
});

Package.onUse(function (api) {
  api.use([
    'underscore',
    'check',
    'minimongo',
    'aldeed:simple-schema',
    'aldeed:collection2@2.4.0'
  ]);

  api.addFiles([
    'lib/nested_property.js',
    'lib/bound_document.js'
  ], ['client', 'server']);

  api.export('BoundDocument');
});

Package.onTest(function (api) {
  api.use('sanjo:jasmine@0.16.4');

  api.use([
    'dispatch:bound-document',
    'mongo'
  ]);

  api.addFiles([
    'tests/tests.js'
  ]);
});
