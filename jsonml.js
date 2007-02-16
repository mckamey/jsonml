/*
	JsonML.js

	Created: 2006-11-09-0116
	Modified: 2007-02-15-2026

	Released under a BSD-style open-source license:
	http://jsonml.org/License.htm

    This file adds these methods to JavaScript:

        string.parseJsonML(filter)

            This method produces a tree of DOM elements from a (JSON text) JsonML tree.

        array.parseJsonML(filter)

            This method produces a tree of DOM elements from a JsonML tree. The
            array must not contain any cyclical references.

            The optional filter parameter is a function which can filter and
            transform the results. It receives each of the DOM nodes, and
            its return value is used instead of the original value. If it
            returns what it received, then structure is not modified. If it
            returns undefined then the member is deleted.

			This is useful for binding unobtrusive JavaScript to the generated
			DOM elements.

            Example:

            // Parses the structure. If an element has a specific CSS value then
            // takes appropriate action: Remove from results, add special event
            // handlers, or bind to a custom component.

            var myUI = myUITemplate.parseJsonML(function (elem) {
				if (elem.className.indexOf("Remove-Me") >= 0) {
					// this will remove from resulting DOM tree
					return undefined;
				}

				if (elem.tagName && elem.tagName.toLowerCase() === "a" &&
					elem.className.indexOf("External-Link") >= 0) {
					// this is the equivalent of target="_blank"
					elem.onclick = function(evt) {
						window.open(elem.href); return false;
					};

				} else if (elem.className.indexOf("Fancy-Widgit") >= 0) {
					// bind to a custom component
					FancyWidgit.bindDOM(elem);
				}
				return elem;
			});

*/

/*element*/ Array.prototype.parseJsonML = function (/*element function(element)*/ filter) {

	var re = /^\s*([a-zA-Z-]+[\w-]*)\s*[:]\s*((\S+\s*\S+)+)\s*$/;// styles RegExp

	//attribute name mapping
	var am = {
		"tabindex" : "tabIndex",
		"accesskey" : "accessKey",
		"hidefocus" : "hideFocus"
	};

	//addAttributes
	/*void*/ function aa(/*element*/ el, /*Object*/ a) {
		// for each attributeName
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
							if (n.toLowerCase() === "float") {
								n = ("undefined" == typeof el.style.styleFloat) ? "cssFloat" : "styleFloat";
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
			} else if (an.toLowerCase() === "class") {
				el.className = a[an];
			} else if (am[an.toLowerCase()]) {
				el.setAttribute(am[an.toLowerCase()], a[an]);
			} else {
				el.setAttribute(an, a[an]);
			}
		}
	}

	//appendChild
	/*void*/ function ac(/*element*/ el, /*Array or String*/ c) {
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
				//eval( "(" + jml[i] + ")" );
			}
		}

		return (el && filter) ? filter(el) : el;
	}

	return p(this);
};

/*element*/ String.prototype.parseJsonML = function (/*function(element)*/ filter) {
	try {
		var jml = this.parseJSON();
	} catch (ex) {
		return null;
	}
	return (jml instanceof Array) ? jml.parseJsonML(filter) : null;
};
