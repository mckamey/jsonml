/*
	JsonML_BST.js
	JsonML + Browser-Side Templating (JBST)

	Created: 2008-07-28-2337
	Modified: 2009-12-26-1120

	Copyright (c)2006-2009 Stephen M. McKamey
	Distributed under an open-source license: http://jsonml.org/license

    This file creates a JsonML.BST type containing these methods:

		// JBST + JSON => JsonML
		var jsonml = JsonML.BST(jbst).dataBind(data);

		// JBST + JSON => DOM
		var dom = JsonML.BST(jbst).bind(data);

		Implement filter to intercept and perform automatic filtering of the resulting DOM tree while binding:
		JsonML.BST.filter = function (element) {
			if (condition) {
				return document.createElement("foo");
			}
			return element;
		};
*/

/* namespace JsonML */
var JsonML;
if ("undefined" === typeof JsonML) {
	JsonML = {};
}

/* wrapper */
JsonML.BST = function(/*JBST*/ jbst) {
	if (jbst instanceof JsonML.BST.init) {
		return jbst;
	}
	return new JsonML.BST.init(jbst);
};

/* ctor */
JsonML.BST.init = function(/*JBST*/ jbst) {
	var self = this,
		jV = "jbst:visible",
		jI = "jbst:oninit",
		jL = "jbst:onload";

	// ensures attribute key contains method or is removed
	// a: attribute object
	// k: property key
	/*void*/ function em(/*object*/ a, /*string*/ k) {
		// callback method
		var c = a[k];
		if ("undefined" !== typeof c) {
			// ensure is method
			if ("function" !== typeof c) {
				try {
					/*jslint evil:true */
					c = new Function(String(c));
					/*jslint evil:false */
				} catch (ex) {
					c = null;
				}
			}
			if (c) {
				// IE doesn't like colon in property names
				a[k.replace(':', '$')] = c;
			}
			delete a[k];
		}
	}

	// appends a child tree to a parent
	// el: parent element
	// c: child tree
	/*void*/ function ac(/*Array*/ el, /*array|object|string*/ c) {
		if (c instanceof Array && c.length && c[0] === "") {
			// result was multiple JsonML sub-trees (as documentFragment)
			c.shift();// remove fragment ident

			// directly append children
			while (c.length) {
				ac(el, c.shift());
			}
		} else if ("object" === typeof c) {
			// result was a JsonML node (attributes or children)
			el.push(c);
		} else if ("undefined" !== typeof c && c !== null) {
			// must convert to string or JsonML will discard
			c = String(c);

			// skip processing empty string literals
			if (c && el.length > 1 && "string" === typeof el[el.length-1]) {
				// combine strings
				el[el.length-1] += c;
			} else if (c || !el.length) {
				// append
				el.push(c);
			}
		}
	}

	// recursively applies dataBind to all nodes of the template graph
	// NOTE: it is very important to replace each node with a copy,
	// otherwise it destroys the original template.
	// t: current template node being data bound
	// d: current data item being bound
	// n: index of current data item
	// l: count of current set of data items
	// j: nested JBST template
	// returns: JsonML nodes
	/*object*/ function db(/*JBST*/ t, /*object*/ d, /*int*/ n, /*int*/ l, /*JBST*/ j) {
		// process JBST node
		if (t) {
			// output
			var o;

			if ("function" === typeof t) {
				try {
					// setup context for code block
					self.data = d;
					self.index = isFinite(n) ? Number(n) : NaN;
					self.count = isFinite(l) ? Number(l) : NaN;
					// execute t in the context of self as "this"
					o = t.call(self, j);
				} finally {
					// cleanup contextual members
					delete self.count;
					delete self.index;
					delete self.data;
				}

				if (o instanceof JsonML.BST.init) {
					// allow returned JBSTs to recursively bind
					// useful for creating "switcher" template methods
					return o.dataBind(d, n, l, j);
				}
				return o;
			}

			if (t instanceof Array) {
				// output array
				o = [];
				for (var i=0; i<t.length; i++) {
					// result
					var r = db(t[i], d, n, l, j);
					ac(o, r);
				}

				// if o has attributes, check for JBST commands
				if (o.length > 1 && o[1] && ("object" === typeof o[1]) && !(o[1] instanceof Array)) {
					// visibility JBST command
					var c = o[1][jV];
					if ("undefined" !== typeof c) {
						// cull any false
						if (!c) {
							// suppress rendering of entire subtree
							return "";
						}
						// remove attribute
						delete o[1][jV];
					}

					// oninit JBST callback
					em(o[1], jI);

					// onload JBST callback
					em(o[1], jL);
				}
				return o;
			}

			if ("object" === typeof t) {
				// output object
				o = {};
				// for each property in template node
				for (var p in t) {
					if (t.hasOwnProperty(p)) {
						// evaluate property's value
						var v = db(t[p], d, n, l, j);
						if ("undefined" !== typeof v && v !== null) {
							o[p] = v;
						}
					}
				}
				return o;
			}
		}

		// rest are value types, so return node directly
		return t;
	}

	// retrieve and remove method
	/*function*/ function rm(/*DOM*/ el, /*string*/ k) {
		// IE doesn't like colon in property names
		k = k.replace(':', '$');

		var undef, // intentionally left undefined
			fn = el[k];

		if (fn) {
			try {
				delete el[k];
			} catch (ex) {
				// sometimes IE doesn't like deleting from DOM
				el[k] = undef;
			}
		}
		return fn;
	}

	// JsonML Filter
	/*DOM*/ function jf(/*DOM*/ el) {

		// execute and remove jbst:oninit method
		var fn = rm(el, jI);
		if ("function" === typeof fn) {
			// execute in context of element
			fn.call(el);
		}

		// execute and remove jbst:onload method
		fn = rm(el, jL);
		if ("function" === typeof fn) {
			// queue up to execute after insertion into parentNode
			setTimeout(function() {
				// execute in context of element
				fn.call(el);
				fn = el = null;
			}, 0);
		}

		if (JsonML.BST.filter) {
			return JsonML.BST.filter(el);
		}

		return el;
	}

	// the publicly exposed instance method
	// combines JBST and JSON to produce JsonML
	/*JsonML*/ self.dataBind = function(/*object*/ data, /*int*/ index, /*int*/ count, /*JBST*/ inner) {
		if (data instanceof Array) {
			// create a document fragment to hold list
			var o = [""];

			count = data.length;
			for (var i=0; i<count; i++) {
				// apply template to each item in array
				ac(o, db(jbst, data[i], i, count, inner));
			}
			return o;
		} else {
			// data is singular so apply template once
			return db(jbst, data, index, count, inner);
		}
	};

	/* JBST + JSON => JsonML => DOM */
	/*DOM*/ self.bind = function(/*object*/ data, /*int*/ index, /*int*/ count, /*JBST*/ inner) {

		// databind JSON data to a JBST template, resulting in a JsonML representation
		var jml = self.dataBind(data, index, count, inner);

		// hydrate the resulting JsonML, executing callbacks, and user-filter
		return JsonML.parse(jml, jf);
	};
};

/* override this to perform default filtering of the resulting DOM tree */
/*DOM function(DOM)*/ JsonML.BST.filter = null;
