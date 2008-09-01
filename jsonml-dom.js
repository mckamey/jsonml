/*global JsonML */
/*
	JsonML_DOM.js

	Created: 2007-02-15-2235
	Modified: 2008-08-31-2206

	Released under an open-source license:
	http://jsonml.org/License.htm
*/

if ("undefined" === typeof window.JsonML) {
	window.JsonML = {};
}
/*JsonML*/ JsonML.parseDOM = function(/*DOM*/ elem) {
	if (!elem) {
		return null;
	}

	var i;
	switch (elem.nodeType) {
		case 1: // element
		case 11: // documentFragment
			var jml = [elem.tagName||""];
			var a = elem.attributes;
			var att = {};
			var hasAttrib = false;
			for (i=0; i<a.length; i++) {
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
			if (elem.hasChildNodes()) {
				for (i=0; i<elem.childNodes.length; i++) {
					var c = elem.childNodes[i];
					c = JsonML.parseDOM(c);
					if (c) {
						jml.push(c);
					}
				}
			}
			return jml;
		case 3: // text node
			return elem.nodeValue;
		default: // comments, etc.
			return null;
	}
};

/*JsonML*/ JsonML.parseHTML = function(/*string*/ html) {
	var elem = document.createElement("div");
	elem.innerHTML = html;
	var jml = JsonML.parseDOM(elem);
	if (jml.length === 2) {
		return jml[1];
	}

	// make wrapper a document fragment
	jml[0] = "";
	return jml;
};

/*legacy adapter*/
JsonML.Response = function() {
	// response buffer
	/*string*/ var r = "";

	// accomodate various legacy interfaces
	/*void*/ this.Write = this.write = this.print = this.println = 
			function(/*string*/ value) {
				r += String(value);
			};

	/*void*/ this.Clear = this.clear = function() {
		r = "";
	};

	/*JsonML*/ this.render = function() {
		return JsonML.parseHTML(r);
	};
};
