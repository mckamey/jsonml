/*
	JsonML_DOM.js
	DOM to JsonML utility

	Created: 2007-02-15-2235
	Modified: 2008-08-31-2206

	Copyright (c)2006-2009 Stephen M. McKamey
	Distributed under an open-source license: http://jsonml.org/license
*/

var JsonML;
if ("undefined" === typeof JsonML) {
	JsonML = {};
}

/*JsonML*/ JsonML.parseDOM = function(/*DOM*/ elem, /*function*/ filter) {
	if (!elem || !elem.nodeType) {
		// free references
		elem = null;
		return null;
	}

	var i, jml;
	switch (elem.nodeType) {
		case 1:  // element
		case 9:  // document
		case 11: // documentFragment
			jml = [elem.tagName||""];

			var a = elem.attributes,
				att = {},
				hasAttrib = false;

			for (i=0; a && i<a.length; i++) {
				if (a[i].specified) {
					if (a[i].name === "style") {
						att.style = elem.style.cssText ? elem.style.cssText : a[i].value;
					} else if ("string" === typeof a[i].value) {
						att[a[i].name] = a[i].value;
					}
					hasAttrib = true;
				}
			}
			if (hasAttrib) {
				jml.push(att);
			}

			var c;
			switch (jml[0].toLowerCase()) {
				case "frame":
				case "iframe":
					try {
						if ("undefined" !== typeof elem.contentDocument) {
							// W3C
							c = elem.contentDocument;
						} else if ("undefined" !== typeof elem.contentWindow) {
							// Microsoft
							c = elem.contentWindow.document;
						} else if ("undefined" !== typeof elem.document) {
							// deprecated
							c = elem.document;
						}

						c = JsonML.parseDOM(c, filter);
						if (c) {
							jml.push(c);
						}
					} catch (ex) {}
					break;
				default:
					if (elem.hasChildNodes()) {
						for (i=0; i<elem.childNodes.length; i++) {
							c = elem.childNodes[i];
							c = JsonML.parseDOM(c, filter);
							if (c) {
								jml.push(c);
							}
						}
					}
					break;
			}
			
			// filter result
			if ("function" === typeof filter) {
				jml = filter(jml, elem);
			}

			// free references
			elem = null;
			return jml;
		case 3: // text node
		case 4: // CDATA node
			var str = String(elem.nodeValue);
			// free references
			elem = null;
			return str;
		case 10: // doctype
			jml = ["!"];

			var type = ["DOCTYPE", (elem.name || "html").toLowerCase()];

			if (elem.publicId) {
				type.push("PUBLIC", '"' + elem.publicId + '"');
			}

			if (elem.systemId) {
				type.push('"' + elem.systemId + '"');
			}

			jml.push(type.join(" "));

			// filter result
			if ("function" === typeof filter) {
				jml = filter(jml, elem);
			}

			// free references
			elem = null;
			return jml;
		case 8: // comment node
			if ((elem.nodeValue||"").indexOf("DOCTYPE") !== 0) {
				// free references
				elem = null;
				return null;
			}

			jml = ["!",
					elem.nodeValue];

			// filter result
			if ("function" === typeof filter) {
				jml = filter(jml, elem);
			}

			// free references
			elem = null;
			return jml;
		default: // etc.
			// free references
			elem = null;
			return null;
	}
};

/*JsonML*/ JsonML.parseHTML = function(/*string*/ html, /*function*/ filter) {
	var elem = document.createElement("div");
	elem.innerHTML = html;
	var jml = JsonML.parseDOM(elem, filter);

	// free references
	elem = null;

	if (jml.length === 2) {
		return jml[1];
	}

	// make wrapper a document fragment
	jml[0] = "";
	return jml;
};
