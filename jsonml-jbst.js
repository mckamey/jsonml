/*global JsonML */
/*
	JsonML_BST.js
	JsonML + Browser-Side Templating (JBST) support

	Created: 2008-07-28-2337
	Modified: 2009-03-13-0845

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
if ("undefined" === typeof window.JsonML) {
	window.JsonML = {};
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
	var self = this;

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
			if ("function" === typeof t) {
				// temporary method name using a counter to
				// avoid collisions when recursively calling
				try {
					// setup context for code block
					self.data = d;
					self.index = isFinite(n) ? Number(n) : NaN;
					self.count = isFinite(l) ? Number(l) : NaN;
					self.$jbst = j;
					// execute t in the context of self as "this"
					return t.call(self);
				} finally {
					// cleanup contextual members
					delete self.$jbst;
					delete self.count;
					delete self.index;
					delete self.data;
				}
			}

			var o;
			if (t instanceof Array) {
				// output array
				o = [];
				for (var i=0; i<t.length; i++) {
					// result
					var r = db(t[i], d, n, l, j);
					if (r instanceof Array && r.length && r[0] === "") {
						// result was multiple JsonML trees (documentFragment)
						r.shift();// remove fragment ident
						o = o.concat(r); // directly append children
					} else if ("object" === typeof r) {
						// result was a JsonML node (attributes or children)
						o.push(r);
					} else if ("undefined" !== typeof r && r !== null) {
						// must convert to string or JsonML will discard
						o.push(String(r));
					}
				}

				// if o has attributes, check for JBST commands
				if (o.length > 1 && ("object" === typeof o[1]) && !(o[1] instanceof Array)) {
					// visibility JBST command
					var c = o[1]["jbst:visible"];
					if ("undefined" !== typeof c) {
						// must match exactly
						if (String(c) === "false") {
							// suppress rendering of entire subtree
							return "";
						}
						// remove attribute
						delete o[1]["jbst:visible"];
					}
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

	// the publicly exposed instance method
	// combines JBST and JSON to produce JsonML
	/*JsonML*/ self.dataBind = function(/*object*/ data, /*int*/ index, /*int*/ count, /*JBST*/ inner) {
		if (data instanceof Array) {
			// create a document fragment to hold list
			var o = [""];

			count = data.length;
			for (var i=0; i<count; i++) {
				// apply template to each item in array
				o.push(db(jbst, data[i], i, count, inner));
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

		// hydrate the resulting JsonML
		return JsonML.parse(jml, JsonML.BST.filter);
	};
};

/* override this to perform default filtering of the resulting DOM tree */
/*DOM function(DOM)*/ JsonML.BST.filter = null;
