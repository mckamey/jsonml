/*
    JsonML.js
    2007-01-07

    This file adds these methods to JavaScript:

        array.parseJsonML()

            This method produces a JSON text from an array. The
            array must not contain any cyclical references.

        string.parseJsonML()

            This method parses a JSON text to produce a tree of
            DOM elements.

    http://jsonml.org/License.htm
*/

Array.prototype.parseJsonML = function () {

	var re = /^\s*(\s*?[\w-]+)\s*[:]\s*(.+?)\s*$/;// styles regex

	//attribute name mapping
	var am = {
		"class" : "className",
		"tabindex" : "tabIndex",
		"accesskey" : "accessKey",
		"hidefocus" : "hideFocus"
	};

	//addAttributes
	/*void*/ function aa(/*element*/ el, /*object*/ a) {
		// foreach attributeName
		for (var an in a) {
			if (!an || typeof(a[an]) !== "string") {
				continue;
			}
			if (an.toLowerCase() === "style") {
				var s = a[an];// styles
				s = s.split(";");
				for (var i=0; i<s.length; i++) {
					if (!s[i]) {
						continue;
					}
					if (s[i].match(re)) {
						var n = RegExp.$1; // style property
						var v = RegExp.$2; // style value
						if (n && v) {
							if (n === "float") {
								n = "styleFloat";
							} else {
								// convert property name to camelCase
								n = n.split('-');
								n[0] = n[0].toLowerCase();
								for (var j=1; j<n.length; j++) {
									n[j] = n[j].charAt(0).toUpperCase()+n[j].substr(1).toLowerCase();
								}
								n = n.join("");
							}
							el.style[n] = v;
						}
					}
				}
			} else if (am[an.toLowerCase()]) {
				el.setAttribute(am[an.toLowerCase()], a[an]);
			} else {
				el.setAttribute(an, a[an]);
			}
		}
	}

	//appendChild
	/*void*/ function ac(/*element*/ el, /*array or string*/ c) {
		if (c) {
			if (el.tagName.toLowerCase() === "table" && el.tBodies) {
				// in IE must explicitly nest TDs in TBODY
				var ct = c.tagName ? c.tagName.toLowerCase() : null;// child tagName
				if (ct && ct!=="tbody" && ct!=="thead") {
					// insert in last tbody
					var tb = el.tBodies.length>0 ? el.tBodies[el.tBodies.length-1] : null;// tBody
					if (!tb) {
						tb = document.createElement("tbody");
						el.appendChild(tb);
					}
					tb.appendChild(c);
				}
			} else {
				el.appendChild(c);
			}
		}
	}

	//parseJsonML
	/*element*/ function p(/*JsonML*/ jml) {
		if (!jml) {
			return null;
		}
		if (typeof(jml) === "string") {
			return document.createTextNode(jml);
		}

		if (!(jml instanceof Array) || jml.length < 1 || typeof(jml[0]) !== "string") {
			throw new Error("parseJsonML");
		}

		var t = jml[0]; // tagName
		var x = (t.toLowerCase() === "script"); // check for scripts
		var el = x ? null : document.createElement(t);

		for (var i=1; i<jml.length; i++) {
			if (!x) {
				if (jml[i] instanceof Array || typeof(jml[i]) === "string") {
					// append children
					ac(el, p(jml[i]));
				} else if (typeof(jml[i]) === "object") {
					// add attributes
					aa(el, jml[i]);
				}
			//} else if (typeof(jml[i]) === "string") {
				/*	JSLint: "eval is evil"
					uncomment at your own risk, executes script elements */
				//eval(jml[i]);
			}
		}

		return el;
	}

	return p(this);
};

String.prototype.parseJsonML = function () {
	try {
		var jml = this.parseJSON();
		return (jml instanceof Array) ? jml.p() : null;
	} catch (ex) {
		return null;
	}
};
