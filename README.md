dispatch:bound-document
===============

A Meteor package that adds a `{bind: true}` option to MongoDB and MiniMongo document fetches. When you use it, the returned doc is a `BoundDocument` instance, which will update the database when you set its properties.

* Works on all collection types, managed or unmanaged, local or remote
* Works in both client and server code
* Works on deeply nested properties, but not within arrays

## Installation

```bash
$ meteor add dispatch:bound-document
```

## Prerequisites

The `bind` option will only work if you have attached a SimpleSchema to your collection. See https://github.com/aldeed/meteor-collection2.

## Functions That Support Binding

* `cursor.fetch`
* `cursor.forEach`
* `cursor.map`
* `collection.findOne`

## Examples

### Basic

```js
// Initialize the collection and attach a schema
var c = new Mongo.Collection('widgets');
c.attachSchema({name: {type: String}});

// Insert a document
c.insert({_id: '1', name: 'foo'});

// Retrieve the document with `bind` option set to `true`
var doc = c.findOne('1', {bind: true});

console.log(doc.name); // foo

// Now we just set the property. This changes the property value not only in the
// object but also in the database (or local collection).
doc.name = 'bar';

console.log(doc.name); // bar
doc = c.findOne('1');
console.log(doc.name); // still bar
```

### Nested

```js
// Initialize the collection and attach a schema
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

// Insert a document
c.insert({_id: '1', name: 'foo'});

// Retrieve the document with `bind` option set to `true`
var doc = c.findOne('1', {bind: true});

// Even though there is no `one` property, we can do `doc.one.two.three`
// without fear of error. All possible object fields are initialized.
console.log(doc.one.two.three); // undefined

// Now we just set the property. This changes the property value not only in the
// object but also in the database (or local collection).
doc.one.two.three = 'bar';

console.log(doc.one.two.three); // bar
doc = c.findOne('1');
console.log(doc.one.two.three); // still bar
```

## Binding Yourself

In client or server code:

```js
var boundDoc = new BoundDocument(AnyCollectionWithASchemaAttached, normalDoc);
```
