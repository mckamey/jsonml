/*global JSON, JsonML */
/*
	JsonML2.js

	Created: 2006-11-09-0116
	Modified: 2008-07-28-2337

	Released under an open-source license:
	http://jsonml.org/License.htm

    This file adds these methods to JavaScript:

        JsonML.parse(string|array, filter)

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

            var myUI = JsonML.parse(myUITemplate, function (elem) {
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

if ("undefined" === typeof JsonML) {
	window.JsonML = {};
}

JsonML.parse = function(/*JsonML*/ jml, /*element function(element)*/ filter) {

	//attribute name mapping
	var am = {
		rowspan : "rowSpan",
		colspan : "colSpan",
		cellpadding : "cellPadding",
		cellspacing : "cellSpacing",
		tabindex : "tabIndex",
		accesskey : "accessKey",
		hidefocus : "hideFocus",
		usemap : "useMap",
		maxlength : "maxLength",
		readonly : "readOnly",
		contenteditable : "contentEditable"
		// can add more attributes here as needed
	};

	//addAttributes
	/*void*/ function aa(/*element*/ el, /*Object*/ a) {
		// for each attributeName
		for (var an in a) {
			// attributeValue
			var av = a[an];
			if (an && "string" === typeof av) {
				an = am[an.toLowerCase()] || an;
				if (an === "style") {
					if ("undefined" !== typeof el.style.cssText) {
						el.style.cssText = av;
					} else {
						el.style = av;
					}
				} else if (an === "class") {
					el.className = av;
				} else {
					el.setAttribute(an, av);
				}
			}
		}
	}

	//appendChild
	/*void*/ function ac(/*element*/ el, /*Array or String*/ c) {
		var ct, tb;
		if (c) {
			if (el.tagName.toLowerCase() === "table" && el.tBodies) {
				// in IE must explicitly nest TDs in TBODY
				ct = c.tagName ? c.tagName.toLowerCase() : null;// child tagName
				if (ct && ct!=="tbody" && ct!=="thead") {
					// insert in last tbody
					tb = el.tBodies.length>0 ? el.tBodies[el.tBodies.length-1] : null;// tBody
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

	//JsonML.parse
	/*element*/ function p(/*JsonML*/ jml) {
		if (!jml) {
			return null;
		}
		if (typeof(jml) === "string") {
			return document.createTextNode(jml);
		}

		if (!(jml instanceof Array) || jml.length < 1 || "string" !== typeof jml[0]) {
			throw new Error("JsonML.parse");
		}

		var t = jml[0]; // tagName
		var x = (t.toLowerCase() === "script"); // check for scripts
		var css = (t.toLowerCase() === "style" && document.createStyleSheet);
		var el = x||css ? null : document.createElement(t);
		if (css) {
			// IE requires this interface for styles
			el = document.createStyleSheet();
		}

		for (var i=1; i<jml.length; i++) {
			if (!x) {
				if (jml[i] instanceof Array || "string" === typeof jml[i]) {
					if (css) {
						// IE requires this interface for styles
						el.cssText = jml[i];
					} else {
						// append children
						ac(el, p(jml[i]));
					}
				} else if ("object" === typeof jml[i] && !css) {
					// add attributes
					aa(el, jml[i]);
				}
			//} else if (typeof(jml[i]) === "string") {
				/*	JSLint: "eval is evil"
					uncomment at your own risk, executes script elements */
				//eval( "(" + jml[i] + ")" );
			}
		}

		if (css) {
			// in IE styles are effective immediately
			return null;
		}

		return (el && "function" === typeof filter) ? filter(el) : el;
	}

	if (jml instanceof Array) {
		return p(jml);
	} else if ("string" === typeof jml) {

		try {
			jml = JSON.parse(jml);
		} catch (ex) {
			return null;
		}

		if (jml instanceof Array) {
			return JsonML.parse(jml, filter);
		}
	}
	return null;
};
