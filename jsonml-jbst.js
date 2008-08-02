/*global JBST */
/*---------------------------------------------------------*\
	JsonML Browser Side Templates
	Copyright (c)2006-2008 Stephen M. McKamey
	Created: 2008-07-28-2337
	Modified: 2008-07-29-0856
\*---------------------------------------------------------*/

/* namespace JBST */
if ("undefined" === typeof JBST) {
	window.JBST = {};
}

/*JsonML*/ JBST.dataBind = function(/*JsonML*/ template, /*object*/ data, /*int*/ index) {
	// NOTE: it is very important to add transformations to a copy of the template
	// nodes, otherwise it destroys the original template.

	// recursively apply to all nodes of the template graph
	/*object*/ function dataBind(/*object*/ node, /*object*/ data, /*int*/ index) {
		if (node) {
			if ("function" === typeof node) {
				// this corresponds to the single $
				return node(
					{
						data: data,
						index: isFinite(index) ? Number(index) : -1
					});
			}

			var output;
			if (node instanceof Array) {
				output = [];
				for (var i=0; i<node.length; i++) {
					var result = dataBind(node[i], data, index);
					if (result instanceof Array && result.IEnumerable) {
						output = output.concat(result);
					} else if ("object" === typeof result) {
						output.push(result);
					} else {
						output.push(String(result));
					}
				}
				return output;
			}

			if ("object" === typeof node) {
				output = {};
				for (var key in node) {
					if (node.hasOwnProperty(key)) {
						output[key] = dataBind(node[key], data, index);
					}
				}
				return output;
			}
		}

		// rest are value types, so return directly
		return node;
	}

	return dataBind(template, data, index);
};

/*JsonML*/ JBST.forEach = function(/*JsonML*/ template, /*array*/ data) {
	var output = [];

	// TODO: need some sort of flag here, instanceof?
	output.IEnumerable = true;

	if (data instanceof Array) {
		for (var i=0; i<data.length; i++) {

			output[i] = JBST.dataBind(template, data[i], i);
		}
	}

	return output;
};