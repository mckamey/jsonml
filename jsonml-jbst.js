/*
	JsonML_BST.js
	JsonML + Browser-Side Templating (JBST)

	Created: 2008-07-28-2337
	Modified: 2010-03-09-2304

	Copyright (c)2006-2010 Stephen M. McKamey
	Distributed under an open-source license: http://jsonml.org/license

    This file creates a JsonML.BST type containing these methods:

		// JBST + JSON => JsonML
		var jsonml = JsonML.BST(jbst).dataBind(data);

		// JBST + JSON => DOM
		var dom = JsonML.BST(jbst).bind(data);

		Implement filter to intercept and perform automatic filtering of the resulting DOM tree while binding:
		JsonML.BST.filter = function (element) {
			if (condition) {
				// this will remove from resulting DOM tree
				return null;
			}
			return element;
		};

		Implement onerror to handle any runtime errors while binding:
		JsonML.BST.onerror = function (ex, jbst, data, index, count, inner) {
			// display inline error message
			return "["+ex+"]";
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
		SHOW = "jbst:visible",
		INIT = "jbst:oninit",
		LOAD = "jbst:onload";

	// ensures attribute key contains method or is removed
	// attr: attribute object
	// key: property key
	/*void*/ function ensureMethod(/*object*/ attr, /*string*/ key) {
		var method = attr[key];
		if ("undefined" !== typeof method) {
			// ensure is method
			if ("function" !== typeof method) {
				try {
					/*jslint evil:true */
					method = new Function(String(method));
					/*jslint evil:false */
				} catch (ex) {
					method = null;
				}
			}
			if (method) {
				// IE doesn't like colon in property names
				attr[key.split(':').join('$')] = method;
			}
			delete attr[key];
		}
	}

	// appends a child tree to a parent
	// elem: parent element
	// child: child tree
	/*void*/ function appendChild(/*Array*/ elem, /*array|object|string*/ child) {
		if (child instanceof Array && child.length && child[0] === "") {
			// result was multiple JsonML sub-trees (as documentFragment)
			child.shift();// remove fragment ident

			// directly append children
			while (child.length) {
				appendChild(elem, child.shift());
			}
		} else if ("object" === typeof child) {
			// result was a JsonML node (attributes or children)
			elem.push(child);
		} else if ("undefined" !== typeof child && child !== null) {
			// must convert to string or JsonML will discard
			child = String(child);

			// skip processing empty string literals
			if (child && elem.length > 1 && "string" === typeof elem[elem.length-1]) {
				// combine strings
				elem[elem.length-1] += child;
			} else if (child || !elem.length) {
				// append
				elem.push(child);
			}
		}
	}

	// default onerror handler
	// ex: exception
	/*JsonML*/ function onerror(/*Error*/ ex, /*JBST*/ node, /*object*/ data, /*int*/ index, /*int*/ count, /*JBST*/ inner) {
		return "["+ex+"]";
	}

	// recursively applies dataBind to all nodes of the template graph
	// NOTE: it is very important to replace each node with a copy,
	// otherwise it destroys the original template.
	// node: current template node being data bound
	// data: current data item being bound
	// index: index of current data item
	// count: count of current set of data items
	// inner: nested JBST template
	// returns: JsonML nodes
	/*object*/ function dataBind(/*JBST*/ node, /*object*/ data, /*int*/ index, /*int*/ count, /*JBST*/ inner) {
		try {
			// process JBST node
			if (node) {
				// output
				var output;

				if ("function" === typeof node) {
					try {
						// setup context for code block
						self.data = data;
						self.index = isFinite(index) ? Number(index) : NaN;
						self.count = isFinite(count) ? Number(count) : NaN;
						// execute node in the context of self as "this"
						output = node.call(self, inner);
					} finally {
						// cleanup contextual members
						delete self.count;
						delete self.index;
						delete self.data;
					}

					if (output instanceof JsonML.BST.init) {
						// allow returned JBSTs to recursively bind
						// useful for creating "switcher" template methods
						return output.dataBind(data, index, count, inner);
					}
					return output;
				}

				if (node instanceof Array) {
					// output array
					output = [];
					for (var i=0; i<node.length; i++) {
						// result
						var result = dataBind(node[i], data, index, count, inner);
						appendChild(output, result);
					}

					// if output has attributes, check for JBST commands
					if (output.length > 1 && output[1] && ("object" === typeof output[1]) && !(output[1] instanceof Array)) {
						// visibility JBST command
						var child = output[1][SHOW];
						if ("undefined" !== typeof child) {
							// cull any false-y values
							if (!child) {
								// suppress rendering of entire subtree
								return "";
							}
							// remove attribute
							delete output[1][SHOW];
						}

						// jbst:oninit
						ensureMethod(output[1], INIT);

						// jbst:onload
						ensureMethod(output[1], LOAD);
					}
					return output;
				}

				if ("object" === typeof node) {
					output = {};
					// process each property in template node
					for (var property in node) {
						if (node.hasOwnProperty(property)) {
							// evaluate property's value
							var value = dataBind(node[property], data, index, count, inner);
							if ("undefined" !== typeof value && value !== null) {
								output[property] = value;
							}
						}
					}
					return output;
				}
			}

			// rest are value types, so return node directly
			return node;
		} catch (ex) {
			try {
				// handle error with complete context
				return ("function" === typeof JsonML.BST.onerror ? JsonML.BST.onerror : onerror)(ex, node, data, index, count, inner);
			} catch (ex2) {
				return null;
			}
		}
	}

	// retrieve and remove method
	/*function*/ function popMethod(/*DOM*/ elem, /*string*/ key) {
		// IE doesn't like colon in property names
		key = key.split(':').join('$');

		var undef, // intentionally left undefined
			method = elem[key];

		if (method) {
			try {
				delete elem[key];
			} catch (ex) {
				// sometimes IE doesn't like deleting from DOM
				elem[key] = undef;
			}
		}
		return method;
	}

	// JsonML Filter
	/*DOM*/ function filter(/*DOM*/ elem) {

		// execute and remove jbst:oninit method
		var method = popMethod(elem, INIT);
		if ("function" === typeof method) {
			// execute in context of element
			method.call(elem);
		}

		// execute and remove jbst:onload method
		method = popMethod(elem, LOAD);
		if ("function" === typeof method) {
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

	// the publicly exposed instance method
	// combines JBST and JSON to produce JsonML
	/*JsonML*/ self.dataBind = function(/*object*/ data, /*int*/ index, /*int*/ count, /*JBST*/ inner) {
		if (data instanceof Array) {
			// create a document fragment to hold list
			var output = [""];

			count = data.length;
			for (var i=0; i<count; i++) {
				// apply template to each item in array
				appendChild(output, dataBind(jbst, data[i], i, count, inner));
			}
			return output;
		} else {
			// data is singular so apply template once
			return dataBind(jbst, data, index, count, inner);
		}
	};

	/* JBST + JSON => JsonML => DOM */
	/*DOM*/ self.bind = function(/*object*/ data, /*int*/ index, /*int*/ count, /*JBST*/ inner) {

		// databind JSON data to a JBST template, resulting in a JsonML representation
		var jml = self.dataBind(data, index, count, inner);

		// hydrate the resulting JsonML, executing callbacks, and user-filter
		return JsonML.parse(jml, filter);
	};

	// replaces a DOM element with element result from binding
	/*void*/ self.replace = function(/*DOM*/ elem, /*object*/ data, /*int*/ index, /*int*/ count, /*JBST*/ inner) {
		if ("string" === typeof elem) {
			elem = document.getElementById(elem);
		}

		if (elem && elem.parentNode) {
			var jml = self.bind(data, index, count, inner);
			if (jml) {
				elem.parentNode.replaceChild(jml, elem);
			}
		}
	};
};

/* override this to perform default filtering of the resulting DOM tree */
/*DOM function(DOM)*/ JsonML.BST.filter = null;

/* override this to perform custom error handling during binding */
/*DOM function(DOM)*/ JsonML.BST.onerror = null;
