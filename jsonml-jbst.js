/*
	jsonml-jbst.js
	JsonML + Browser-Side Templating (JBST)

	Created: 2008-07-28-2337
	Modified: 2010-09-13-1952

	Copyright (c)2006-2010 Stephen M. McKamey
	Distributed under The MIT License: http://jsonml.org/license

	NOTE: requires jsonml-html.js and jsonml-utils.js.

	This file creates a JsonML.BST type containing these methods:

		// JBST + JSON => DOM
		var dom = JsonML.BST(jbst).bind(data);

		// JBST + JSON => JsonML
		var jsonml = JsonML.BST(jbst).dataBind(data);

		// implement filter to intercept and perform custom filtering of resulting DOM elements
		JsonML.BST.filter = function(elem) {
			if (condition) {
				// this will prevent insertion into resulting DOM tree
				return null;
			}
			return elem;
		};

		// implement onerror event to handle any runtime errors while binding
		JsonML.BST.onerror = function(ex) {
			// access the current context via this.data, this.index, etc.
			// display custom inline error messages
			return '['+ex+']';
		};

		// implement onbound event to perform custom processing of elements after binding
		JsonML.BST.onbound = function(node) {
			// access the current context via this.data, this.index, etc.
			// watch elements as they are constructed
			if (window.console) {
				console.log(JSON.stringify(output));
			}
		};

		// implement onappend event to perform custom processing of children before being appended
		JsonML.BST.onappend = function(parent, child) {
			// access the current context via this.data, this.index, etc.
			// watch elements as they are added
			if (window.console) {
				console.log(JsonML.getTagName(parent)+' > '+JsonML.getTagName(child));
			}
		};
*/

/* namespace JsonML */
var JsonML = JsonML || {};

if (typeof module === 'object') {
	module.exports = JsonML;
}

JsonML.BST = (function(){
	'use strict';

	var SHOW = 'jbst:visible',
		INIT = 'jbst:oninit',
		LOAD = 'jbst:onload';

	// ensures attribute key contains method or is removed
	// attr: attribute object
	// key: method name
	/*function*/ function ensureMethod(/*object*/ attr, /*string*/ key) {
		var method = attr[key] || null;
		if (method) {
			// ensure is method
			if ('function' !== typeof method) {
				try {
					/*jslint evil:true */
					method = new Function(String(method));
					/*jslint evil:false */
				} catch (ex) {
					// filter
					method = null;
				}
			}
			if (method) {
				// IE doesn't like colon in property names
				attr[key.split(':').join('$')] = method;
			}
			delete attr[key];
		}
		return method;
	}

	// default onerror handler, override JsonML.BST.onerror to change
	/*JsonML*/ function onError(/*Error*/ ex) {
		return '['+ex+']';
	}

	// retrieve and remove method
	/*function*/ function popMethod(/*DOM*/ elem, /*string*/ key) {
		// IE doesn't like colon in property names
		key = key.split(':').join('$');

		var method = elem[key];
		if (method) {
			try {
				delete elem[key];
			} catch (ex) {
				// sometimes IE doesn't like deleting from DOM
				elem[key] = undefined;
			}
		}
		return method;
	}

	// JsonML Filter
	/*DOM*/ function filter(/*DOM*/ elem) {

		// execute and remove jbst:oninit method
		var method = popMethod(elem, INIT);
		if ('function' === typeof method) {
			// execute in context of element
			method.call(elem);
		}

		// execute and remove jbst:onload method
		method = popMethod(elem, LOAD);
		if ('function' === typeof method) {
			// queue up to execute after insertion into parentNode
			setTimeout(function() {
				// execute in context of element
				method.call(elem);
				method = elem = null;
			}, 0);
		}

		if (JsonML.BST.filter) {
			return JsonML.BST.filter(elem);
		}

		return elem;
	}

	/*object*/ function callContext(
		/*object*/ self,
		/*object*/ data,
		/*int*/ index,
		/*int*/ count,
		/*object*/ args,
		/*function*/ method,
		/*Array*/ methodArgs) {

		try {
			// setup context for code block
			self.data = ('undefined' !== typeof data) ? data : null;
			self.index = isFinite(index) ? Number(index) : NaN;
			self.count = isFinite(count) ? Number(count) : NaN;
			self.args = ('undefined' !== typeof args) ? args : null;

			// execute node in the context of self as 'this', passing in any parameters
			return method.apply(self, methodArgs || []);

		} finally {
			// cleanup contextual members
			delete self.count;
			delete self.index;
			delete self.data;
			delete self.args;
		}
	}

	var appendChild = JsonML.appendChild;

	/* ctor */
	function JBST(/*JsonML*/ jbst) {
		if ('undefined' === typeof jbst) {
			throw new Error('JBST tree is undefined');
		}

		var self = this;

		// recursively applies dataBind to all nodes of the template graph
		// NOTE: it is very important to replace each node with a copy,
		// otherwise it destroys the original template.
		// node: current template node being data bound
		// data: current data item being bound
		// index: index of current data item
		// count: count of current set of data items
		// args: state object
		// returns: JsonML nodes
		/*object*/ function dataBind(/*JsonML*/ node, /*object*/ data, /*int*/ index, /*int*/ count, /*object*/ args) {
			try {
				// recursively process each node
				if (node) {
					var output;

					if ('function' === typeof node) {
						output = callContext(self, data, index, count, args, node);

						if (output instanceof JBST) {
							// allow returned JBSTs to recursively bind
							// useful for creating 'switcher' template methods
							return output.dataBind(data, index, count, args);
						}

						// function result
						return output;
					}

					if (node instanceof Array) {
						var onBound = ('function' === typeof JsonML.BST.onbound) && JsonML.BST.onbound,
							onAppend = ('function' === typeof JsonML.BST.onappend) && JsonML.BST.onappend,
							appendCB = onAppend && function(parent, child) {
								callContext(self, data, index, count, args, onAppend, [parent, child]);
							};

						// JsonML output
						output = [];
						for (var i=0; i<node.length; i++) {
							var child = dataBind(node[i], data, index, count, args);
							appendChild(output, child, appendCB);

							if (!i && !output[0]) {
								onAppend = appendCB = null;
							}
						}

						if (output[0] && onBound) {
							callContext(self, data, index, count, args, onBound, [output]);
						}

						// if output has attributes, check for JBST commands
						if (JsonML.hasAttributes(output)) {
							// visibility JBST command
							var visible = output[1][SHOW];
							if ('undefined' !== typeof visible) {
								// cull any false-y values
								if (!visible) {
									// suppress rendering of entire subtree
									return '';
								}
								// remove attribute
								delete output[1][SHOW];
							}

							// jbst:oninit
							ensureMethod(output[1], INIT);

							// jbst:onload
							ensureMethod(output[1], LOAD);
						}

						// JsonML element
						return output;
					}

					if ('object' === typeof node) {
						output = {};
						// process each property in template node
						for (var property in node) {
							if (node.hasOwnProperty(property)) {
								// evaluate property's value
								var value = dataBind(node[property], data, index, count, args);
								if ('undefined' !== typeof value && value !== null) {
									output[property] = value;
								}
							}
						}
						// attributes object
						return output;
					}
				}

				// rest are simple value types, so return node directly
				return node;
			} catch (ex) {
				try {
					// handle error with complete context
					var err = ('function' === typeof JsonML.BST.onerror) ? JsonML.BST.onerror : onError;
					return callContext(self, data, index, count, args, err, [ex]);
				} catch (ex2) {
					return '['+ex2+']';
				}
			}
		}

		/*JsonML*/ function iterate(/*JsonML*/ node, /*object*/ data, /*int*/ index, /*int*/ count, /*object*/ args) {
			if (data instanceof Array) {
				// create a document fragment to hold list
				var output = [''];

				count = data.length;
				for (var i=0; i<count; i++) {
					// apply template to each item in array
					appendChild(output, dataBind(jbst, data[i], i, count, args));
				}
				// document fragment
				return output;
			} else {
				// data is singular so apply template once
				return dataBind(jbst, data, index, count, args);
			}
		}

		// the publicly exposed instance methods

		// combines JBST and JSON to produce JsonML
		/*JsonML*/ self.dataBind = function(/*object*/ data, /*int*/ index, /*int*/ count, /*object*/ args) {
			// data is singular so apply template once
			return iterate(jbst, data, index, count, args);
		};

		/* JBST + JSON => JsonML => DOM */
		/*DOM*/ self.bind = function(/*object*/ data, /*int*/ index, /*int*/ count, /*object*/ args) {

			// databind JSON data to a JBST template, resulting in a JsonML representation
			var jml = iterate(jbst, data, index, count, args);

			// hydrate the resulting JsonML, executing callbacks, and user-filter
			return JsonML.toHTML(jml, filter);
		};

		// replaces a DOM element with result from binding
		/*void*/ self.replace = function(/*DOM*/ elem, /*object*/ data, /*int*/ index, /*int*/ count, /*object*/ args) {
			if ('string' === typeof elem) {
				elem = document.getElementById(elem);
			}

			if (elem && elem.parentNode) {
				var jml = self.bind(data, index, count, args);
				if (jml) {
					elem.parentNode.replaceChild(jml, elem);
				}
			}
		};

		// displace a DOM element with result from binding JsonML+BST node bound within this context
		/*void*/ self.displace = function(/*DOM*/ elem, /*JsonML*/ node, /*object*/ data, /*int*/ index, /*int*/ count, /*object*/ args) {
			if ('string' === typeof elem) {
				elem = document.getElementById(elem);
			}

			if (elem && elem.parentNode) {
				// databind JSON data to a JBST template, resulting in a JsonML representation
				var jml = iterate(node, data, index, count, args);

				// hydrate the resulting JsonML, executing callbacks, and user-filter
				jml = JsonML.toHTML(jml, filter);
				if (jml) {
					elem.parentNode.replaceChild(jml, elem);
				}
			}
		};

		// patches a DOM element with JsonML+BST node bound within this context
		/*void*/ self.patch = function(/*DOM*/ elem, /*JsonML*/ node, /*object*/ data, /*int*/ index, /*int*/ count, /*object*/ args) {
			if ('string' === typeof elem) {
				elem = document.getElementById(elem);
			}

			if (elem) {
				var jml = [''];
				appendChild(jml, dataBind(node, data, index, count, args));
				JsonML.patch(elem, jml, filter);
			}
		};
	}

	/* factory method */
	return function(/*JBST*/ jbst) {
		return (jbst instanceof JBST) ? jbst : new JBST(jbst);
	};
})();

/* override to perform default filtering of the resulting DOM tree */
/*function*/ JsonML.BST.filter = null;

/* override to perform custom error handling during binding */
/*function*/ JsonML.BST.onerror = null;

/* override to perform custom processing of each element after adding to parent */
/*function*/ JsonML.BST.onappend = null;

/* override to perform custom processing of each element after binding */
/*function*/ JsonML.BST.onbound = null;
