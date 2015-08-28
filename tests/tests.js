describe('BoundDocument', function () {

  var c = new Mongo.Collection('widgets');
  c.attachSchema({
    name: {type: String},
    one: {
      type: Object,
      optional: true
    },
    'one.two': {
      type: Object,
      optional: true
    },
    'one.two.three': {
      type: String,
      optional: true
    }
  });

  c.allow({
    insert: function () { return true; },
    update: function () { return true; },
    remove: function () { return true; }
  });

  beforeEach(function () {
    c.remove({_id: '1'});
    c.insert({_id: '1', name: 'foo'});
  });

  it('gets and sets property values', function () {
    var doc = c.findOne('1', {bind: true});

    expect(doc.name).toEqual('foo');
    expect(doc.one.two.three).toBeUndefined();

    doc.name = 'name';
    doc.one.two.three = 'bar';

    // immediately updated
    expect(doc.name).toEqual('name');
    expect(doc.one.two.three).toEqual('bar');

    // still updated after another retrieve
    doc = c.findOne('1');
    expect(doc.name).toEqual('name');
    expect(doc.one.two.three).toEqual('bar');
  });

  describe('collection.findOne', function () {

    it('returns a normal document without bind option', function () {
      var doc = c.findOne('1');
      expect(doc instanceof BoundDocument).toEqual(false);
    });

    it('returns a bound document with bind option', function () {
      var doc = c.findOne('1', {bind: true});
      expect(doc instanceof BoundDocument).toEqual(true);
    });

  });

  describe('cursor.fetch', function () {

    it('returns a normal document without bind option', function () {
      var doc = c.find('1').fetch()[0];
      expect(doc instanceof BoundDocument).toEqual(false);
    });

    it('returns a bound document with bind option', function () {
      var doc = c.find('1', {bind: true}).fetch()[0];
      expect(doc instanceof BoundDocument).toEqual(true);
    });

  });

  describe('cursor.forEach', function () {

    it('returns a normal document without bind option', function () {
      c.find('1').forEach(function (doc) {
        expect(doc instanceof BoundDocument).toEqual(false);
      });
    });

    it('returns a bound document with bind option', function () {
      c.find('1', {bind: true}).forEach(function (doc) {
        expect(doc instanceof BoundDocument).toEqual(true);
      });
    });

  });

  describe('cursor.map', function () {

    it('returns a normal document without bind option', function () {
      c.find('1').map(function (doc) {
        expect(doc instanceof BoundDocument).toEqual(false);
      });
    });

    it('returns a bound document with bind option', function () {
      c.find('1', {bind: true}).map(function (doc) {
        expect(doc instanceof BoundDocument).toEqual(true);
      });
    });

  });

});
