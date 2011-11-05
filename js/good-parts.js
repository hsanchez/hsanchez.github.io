// Code from "Javascript: The Good Parts" by Douglas Crockford, 2008

// NOTES
// Create a new object with the object literal
//     var o = { property_a: 'foo', property_b: 'bar' };
//
// objects are linked to Object.prototype
// Function objects are linked to Function.prototype, which is linked to
// Object.prototype
//
// Create a new function with the function literal
//     var f = function() {};
//
// Function objects contain a link to the outer context (closure).

// Simpler object creation
// Usage:
// var foo = {};
// var bar = Object.create(foo);
if (typeof Object.create !== 'function') {
  Object.create = function(o) {
    var F = function() {};
    F.prototype = o;
    return new F();
  };
}