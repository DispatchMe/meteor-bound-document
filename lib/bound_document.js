/* global LocalCollection:false - from minimongo */
/* global BoundDocument:true */
/* global nestedProperty:false */

BoundDocument = function BoundDocument(collection, doc) {
  var self = this;

  if (! (self instanceof BoundDocument))
    throw new Error('use "new" to construct a BoundDocument');

  var collectionSchema = collection.simpleSchema();
  if (!collectionSchema) throw new Error('Collections passed to BoundDocument must have a schema attached.');

  self.__doc = doc;

  var schemaFields = collectionSchema.schema();

  // Create all objects first
  _.each(schemaFields, function (definition, field) {
    // We don't go into arrays. Stop if the field is an array (ends with .$) or
    // is within an array (contains .$.).
    if (field.indexOf('.$.') > -1 || field.slice(-2) === '.$') return;

    if (definition.type === Object) {
      nestedProperty.set(self, field, {});
    }
  });

  // Then create getter/setter props for non-objects
  _.each(schemaFields, function (definition, field) {
    // We don't go into arrays. Stop if the field is an array (ends with .$) or
    // is within an array (contains .$.).
    if (field.indexOf('.$.') > -1 || field.slice(-2) === '.$') return;

    // Otherwise define a getter and setter for each non-object schema property
    var obj = self;
    var lastDot = field.lastIndexOf('.');
    if (lastDot > -1) {
      obj = nestedProperty.get(obj, field.slice(0, lastDot));
    }

    // Object.defineProperty can only be called on plain Object, so we can't
    // use this for setting a full object into the database
    if (definition.type !== Object) {
      Object.defineProperty(
        obj,
        field.slice(lastDot + 1),
        {
          enumerable: true,
          get: function () {
            return nestedProperty.get(self.__doc, field);
          },
          set: function (value) {
            var modifier = {};
            // If value is undefined $unset
            if (value === undefined) {
              modifier.$unset = {};
              modifier.$unset[field] = '';
            }
            // Otherwise $set
            else {
              modifier.$set = {};
              modifier.$set[field] = value;
            }

            nestedProperty.set(self.__doc, field, value);
            collection.update(doc._id, modifier);
          }
        }
      );
    }
  });
};

function overrideForEachAndMap(cursor, collection) {
  ['forEach', 'map'].forEach(function (prop) {
    var original = cursor[prop];
    cursor[prop] = function (callback, thisArg) {
      return original.call(cursor, function () {
        var args = _.toArray(arguments);

        // replace each document with a BoundDocument object
        args[0] = new BoundDocument(collection, args[0]);

        callback.apply(thisArg, args);
      });
    };
  });
}

function overrideFetch(cursor, collection) {
  var original = cursor.fetch;
  cursor.fetch = function () {
    var docs = original.apply(cursor, arguments);
    return _.map(docs, function (doc) {
      return new BoundDocument(collection, doc);
    });
  };
}

function overrideFind(objList) {
  objList.forEach(function (obj) {
    var originalFind = obj.prototype.find;
    obj.prototype.find = function (selector, options) {
      var cursor = originalFind.apply(this, arguments);

      // We support a custom option, 'bind'
      if (options && options.bind === true) {
        if (!this.simpleSchema())
          throw new Error('The bind option is supported only when a SimpleSchema is attached');

        overrideForEachAndMap(cursor, this);
        overrideFetch(cursor, this);
      }

      return cursor;
    };
  });
}

if (Meteor.isServer) {
  overrideFind([LocalCollection, Mongo.Collection]);

  // Need to handle findOne specifically on the server
  var originalFindOne = Mongo.Collection.prototype.findOne;
  Mongo.Collection.prototype.findOne = function (selector, options) {
    var doc = originalFindOne.apply(this, arguments);

    // We support a custom option, 'bind'
    if (doc && options && options.bind === true) {
      if (!this.simpleSchema())
        throw new Error('The bind option is supported only when a SimpleSchema is attached');

      doc = new BoundDocument(this, doc);
    }

    return doc;
  };
} else {
  overrideFind([LocalCollection]);
}
