/*global JsonML */
/*
	JsonML_BST.js
	JsonML Browser Side Templating

	Created: 2008-07-28-2337
	Modified: 2008-08-02-1501

	Released under an open-source license:
	http://jsonml.org/License.htm

    This file creates a global JsonML object containing this method:

        JsonML.dataBind(template, data)
*/

/* namespace JsonML */
if ("undefined" === typeof JsonML) {
	window.JsonML = {};
}

// combines JsonML+BST and JSON to produce JsonML
/*JsonML*/ JsonML.dataBind = function(/*JsonML+BST*/ jbst, /*JSON*/ data) {
	// NOTE: it is very important to add transformations to a copy of the template
	// nodes, otherwise it destroys the original template.

	// recursively applies dataBind to all nodes of the template graph
	/*object*/ function db(/*JsonML+BST*/ t, /*JSON*/ d, /*int*/ n) {
		// for each JsonML+BST node
		if (t) {
			if ("function" === typeof t) {
				// this corresponds to the $item parameter
				return t(
					{
						data: d,
						index: isFinite(n) ? Number(n) : -1
					});
			}

			var o;
			if (t instanceof Array) {
				// output array
				o = [];
				for (var i=0; i<t.length; i++) {
					// result
					var r = db(t[i], d, n);
					if (r instanceof Array && r.$isBST) {
						// result was multiple JsonML trees
						o = o.concat(r);
					} else if ("object" === typeof r) {
						// result was a JsonML tree
						o.push(r);
					} else {
						// must convert to string or JsonML will discard
						o.push(String(r));
					}
				}
				return o;
			}

			if ("object" === typeof t) {
				// output object
				o = {};
				// for each property in node
				for (var p in t) {
					if (t.hasOwnProperty(p)) {
						o[p] = db(t[p], d, n);
					}
				}
				return o;
			}
		}

		// rest are value types, so return node directly
		return t;
	}

	if (data instanceof Array) {
		var o = [];

		// flag container to differentiate from JsonML
		o.$isBST = true;

		for (var i=0; i<data.length; i++) {
			// apply template to each item in array
			o[i] = db(jbst, data[i], i);
		}
		return o;
	} else {
		// data is singular to apply template once
		return db(jbst, data, -1);
	}
};
