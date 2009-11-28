/*
	JsonML.js
	JsonML builder

	Created: 2006-11-09-0116
	Modified: 2009-11-08-1728

	Released under an open-source license:
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
					return null;
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

if (!Array.prototype.parseJsonML) {
	/*DOM*/ Array.prototype.parseJsonML = function (/*DOM function(DOM)*/ filter) {

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

		// attribute duplicates
		var ad = {
			enctype : "encoding"
			// can add more attributes here as needed
		};

		//addAttributes
		/*DOM*/ function aa(/*DOM*/ el, /*object*/ a) {
			if (a.name && document.attachEvent) {
				try {
					// IE fix for not being able to programatically change the name attribute
					var el2 = document.createElement("<"+el.tagName+" name='"+a.name+"'>");
					// fix for Opera 8.5 and Netscape 7.1 creating malformed elements
					if (el.tagName === el2.tagName) {
						el = el2;
					}
				} catch (ex) { }
			}

			// for each attributeName
			for (var an in a) {
				if (a.hasOwnProperty(an)) {
					// attributeValue
					var av = a[an];
					if (an && av) {
						an = am[an.toLowerCase()] || an;
						if (an === "style") {
							if ("undefined" !== typeof el.style.cssText) {
								el.style.cssText = av;
							} else {
								el.style = av;
							}
						} else if (an === "class") {
							el.className = av;
						} else if ("string" === typeof av || "number" === typeof av || "boolean" === typeof av) {
							el.setAttribute(an, av);

							// TODO: explicitly name these to prevent false positives
							// in IE cannot set onclick events directly
							if (an.indexOf('on') === 0 && "function" !== typeof el[an]) {
								/*jslint evil:true */
								el[an] = new Function(av);

								// also set duplicated attributes
								if (ad[an]) {
									el[ad[an]] = new Function(av);
								}
								/*jslint evil:false */
							} else {
								// also set duplicated attributes
								if (ad[an]) {
									el.setAttribute(ad[an], av);
								}
							}
						} else {

							// allow direct setting of complex properties
							el[an] = av;

							// also set duplicated attributes
							if (ad[an]) {
								el[ad[an]] = av;
							}
						}
					}
				}
			}
			return el;
		}

		//appendChild
		/*void*/ function ac(/*DOM*/ el, /*DOM*/ c) {
			var ct, tb;
			if (c) {
				if (el.tagName && el.tagName.toLowerCase() === "table" && el.tBodies) {
					if (!c.tagName) {
						// must unwrap documentFragment for tables
						if (c.nodeType === 11) {
							while (c.firstChild) {
								ac(el, c.removeChild(c.firstChild));
							}
						}
						return;
					}
					// in IE must explicitly nest TRs in TBODY
					ct = c.tagName.toLowerCase();// child tagName
					if (ct && ct !== "tbody" && ct !== "thead") {
						// insert in last tbody
						tb = el.tBodies.length > 0 ? el.tBodies[el.tBodies.length-1] : null;// tBody
						if (!tb) {
							tb = document.createElement(ct==="th" ? "thead" : "tbody");
							el.appendChild(tb);
						}
						tb.appendChild(c);
					} else if (el.canHaveChildren !== false) {
						el.appendChild(c);
					} else if (el.tagName && el.tagName.toLowerCase() === "object" &&
								c.tagName && c.tagName.toLowerCase() === "param") {
						// IE-only path
						try {
							el.appendChild(c);
						} catch (ex1) {}
						try {
							if (el.object) {
								el.object[c.name] = c.value;
							}
						} catch (ex2) {}
					}
				} else if (el.canHaveChildren !== false) {
					el.appendChild(c);
				}
			}
		}

		// isWhitespace
		/*bool*/ function ws(/*DOM*/ n) {
			return n && (n.nodeType === 3) && (!n.nodeValue || !/\S/.exec(n.nodeValue));
		}

		// trimWhitespace
		/*void*/ function tw(/*DOM*/ el) {
			if (el) {
				while (ws(el.firstChild)) {
					// trim leading whitespace text nodes
					el.removeChild(el.firstChild);
				}
				while (ws(el.lastChild)) {
					// trim trailing whitespace text nodes
					el.removeChild(el.lastChild);
				}
			}
		}

		//JsonML.parse
		/*DOM*/ function p(/*JsonML*/ jml) {
			if (!jml) {
				return null;
			}
			if ("string" === typeof jml) {
				return document.createTextNode(jml);
			}
			if (!(jml instanceof Array) || !jml.length || "string" !== typeof jml[0]) {
				throw new Error("JsonML.parse: invalid JsonML tree");
			}

			var i;
			var t = jml[0]; // tagName
			if (!t) {
				// correctly handle a list of JsonML trees
				// create a document fragment to hold elements
				var f = document.createDocumentFragment ?
					document.createDocumentFragment() :
					document.createElement("");
				for (i=1; i<jml.length; i++) {
					ac(f, p(jml[i]));
				}

				// trim extraneous whitespace
				tw(f);

				// eliminate wrapper for single nodes
				if (f.childNodes.length === 1) {
					return f.firstChild;
				}
				return f;
			}

			var x = (t.toLowerCase() === "script"); // check for scripts
			var css = (t.toLowerCase() === "style" && document.createStyleSheet);
			var el;
			if (css) {
				// IE requires this interface for styles
				el = document.createStyleSheet();
			} else {
				el = x ? null : document.createElement(t);
			}

			for (i=1; i<jml.length; i++) {
				if (!x) {
					if (jml[i] instanceof Array || "string" === typeof jml[i]) {
						if (css) {
							// IE requires this interface for styles
							el.cssText = jml[i];
						} else {
							// append children
							ac(el, p(jml[i]));
						}
					} else if ("object" === typeof jml[i] && jml[i] !== null && el.nodeType === 1) {
						// add attributes
						el = aa(el, jml[i]);
					}
				//} else if (typeof(jml[i]) === "string") {
					/*	JSLint: "eval is evil"
						uncomment at your own risk, executes script elements immediately */
					//eval( "(" + jml[i] + ")" );
				}
			}

			if (css) {
				// in IE styles are effective immediately
				return null;
			}

			// trim extraneous whitespace
			tw(el);
			return (el && "function" === typeof filter) ? filter(el) : el;
		}

		return p(this);
	};
}

if (!String.prototype.parseJsonML) {
	/*DOM*/ String.prototype.parseJsonML = function (/*function(element)*/ filter) {
		var jml;
		try {
			jml = this.parseJSON();
		} catch (ex) {
			return null;
		}
		return (jml instanceof Array) ? jml.parseJsonML(filter) : null;
	};
}