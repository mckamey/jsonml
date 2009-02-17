/*global JsonML */
/*
	JsonML_BST.js
	JsonML + Browser-Side Templating (JBST) support

	Created: 2008-07-28-2337
	Modified: 2009-02-14-1059

	Copyright (c)2006-2009 Stephen M. McKamey
	Distributed under an open-source license: http://jsonml.org/license

    This file creates a JsonML.BST type containing this method:

	new JsonML.BST(template).dataBind(data)
*/

/* namespace JsonML */
if ("undefined" === typeof window.JsonML) {
	window.JsonML = {};
}

JsonML.BST = function(/*JBST*/ jbst) {
	var self = this;

	// unique counter for generated method names
	var g = 0;

	// recursively applies dataBind to all nodes of the template graph
	// NOTE: it is very important to replace each node with a copy,
	// otherwise it destroys the original template.
	// t: current template node being data bound
	// d: current data item being bound
	// n: index of current data item
	// j: nested JBST template
	// returns: JsonML nodes
	/*object*/ function db(/*JBST*/ t, /*object*/ d, /*int*/ n, /*JBST*/ j) {
		// process JBST node
		if (t) {
			if ("function" === typeof t) {
				// temporary method name using a counter to
				// avoid collisions when recursively calling
				var m = "$jbst."+(g++);
				try {
					// setup context for code block
					self[m] = t;
					self.data = d;
					self.jbst = j;
					self.index = isFinite(n) ? Number(n) : NaN;
					// execute in the context of template as "this"
					return self[m]();
				} finally {
					g--;
					delete self[m];
					delete self.data;
					delete self.jbst;
					delete self.index;
				}
			}

			var o;
			if (t instanceof Array) {
				// output array
				o = [];
				for (var i=0; i<t.length; i++) {
					// result
					var r = db(t[i], d, n, j);
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
						var v = db(t[p], d, n, j);
						if ("undefined" !== typeof v && v !== null) {
							o[p] = String(v);
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
	/*JsonML*/ this.dataBind = function(/*object*/ data, /*int*/ index, /*JBST*/ inner) {
		if (data instanceof Array) {
			// create a document fragment to hold list
			var o = [""];

			for (var i=0; i<data.length; i++) {
				// apply template to each item in array
				o.push(db(jbst, data[i], i, inner));
			}
			return o;
		} else {
			// data is singular so apply template once
			return db(jbst, data, index, inner);
		}
	};
};
