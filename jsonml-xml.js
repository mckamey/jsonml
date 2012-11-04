/*global ActiveXObject */
/*
	jsonml-xml.js
	JsonML XML utilities

	Created: 2007-02-15-2235
	Modified: 2012-11-03-2051

	Copyright (c)2006-2012 Stephen M. McKamey
	Distributed under The MIT License: http://jsonml.org/license

	This file creates a global JsonML object containing these methods:

		JsonML.toXML(string|array, filter)
			Converts JsonML to XML nodes

		JsonML.toXMLText(JsonML, filter)
			Converts JsonML to XML text

		JsonML.fromXML(node, filter)
			Converts XML nodes to JsonML

		JsonML.fromXMLText(xmlText, filter)
			Converts XML text to JsonML
*/

var JsonML = JsonML || {};

(function(JsonML, document) {
	'use strict';

	/**
	 * Determines if the value is an Array
	 * 
	 * @private
	 * @param {*} val the object being tested
	 * @return {boolean}
	 */
	var isArray = Array.isArray || function(val) {
		return (val instanceof Array);
	};

	/**
	 * Creates a DOM element 
	 * 
	 * @private
	 * @param {string} tag The element's tag name
	 * @return {Node}
	 */
	var createElement = function(tag) {
		if (!tag) {
			// create a document fragment to hold multiple-root elements
			if (document.createDocumentFragment) {
				return document.createDocumentFragment();
			}

			tag = '';

		} else if (tag.charAt(0) === '!') {
			return document.createComment(tag === '!' ? '' : tag.substr(1)+' ');
		}

		return document.createElement(tag);
	};

	/**
	 * Appends an attribute to an element
	 * 
	 * @private
	 * @param {Node} elem The element
	 * @param {Object} attr Attributes object
	 * @return {Node}
	 */
	var addAttributes = function(elem, attr) {
		// for each attributeName
		for (var name in attr) {
			if (attr.hasOwnProperty(name)) {
				// attributes
				elem.setAttribute(name, attr[name]);
			}
		}
		return elem;
	};

	/**
	 * Appends a child to an element
	 * 
	 * @private
	 * @param {Node} elem The parent element
	 * @param {Node} child The child
	 */
	var appendDOM = function(elem, child) {
		if (child) {
			if (elem.nodeType === 8) { // comment
				if (child.nodeType === 3) { // text node
					elem.nodeValue += child.nodeValue;
				}

			} else if (elem.canHaveChildren !== false) {
				elem.appendChild(child);
			}
		}
	};

	/**
	 * Default error handler
	 * @param {Error} ex
	 * @return {Node}
	 */
	var onError = function (ex) {
		return document.createTextNode('['+ex+']');
	};

	/* override this to perform custom error handling during binding */
	JsonML.onerror = null;

	/**
	 * @param {Node} elem
	 * @param {*} jml
	 * @param {function} filter
	 * @return {Node}
	 */
	var patch = function(elem, jml, filter) {

		for (var i=1; i<jml.length; i++) {
			if (isArray(jml[i]) || 'string' === typeof jml[i]) {
				// append children
				appendDOM(elem, toXML(jml[i], filter));

			} else if ('object' === typeof jml[i] && jml[i] !== null && elem.nodeType === 1) {
				// add attributes
				elem = addAttributes(elem, jml[i]);
			}
		}

		return elem;
	};

	/**
	 * Main builder entry point
	 * @param {string|array} jml
	 * @param {function} filter
	 * @return {Node}
	 */
	var toXML = JsonML.toXML = function(jml, filter) {
		try {
			if (!jml) {
				return null;
			}
			if ('string' === typeof jml) {
				return document.createTextNode(jml);
			}
			if (!isArray(jml) || ('string' !== typeof jml[0])) {
				throw new SyntaxError('invalid JsonML');
			}

			var tagName = jml[0]; // tagName
			if (!tagName) {
				// correctly handle a list of JsonML trees
				// create a document fragment to hold elements
				var frag = createElement('');
				for (var i=1; i<jml.length; i++) {
					appendDOM(frag, toXML(jml[i], filter));
				}

				// eliminate wrapper for single nodes
				if (frag.childNodes.length === 1) {
					return frag.firstChild;
				}
				return frag;
			}

			var elem = patch(createElement(tagName), jml, filter);

			return (elem && 'function' === typeof filter) ? filter(elem) : elem;
		} catch (ex) {
			try {
				// handle error with complete context
				var err = ('function' === typeof JsonML.onerror) ? JsonML.onerror : onError;
				return err(ex, jml, filter);
			} catch (ex2) {
				return document.createTextNode('['+ex2+']');
			}
		}
	};

	/**
	 * Converts JsonML to XML text
	 * @param {string|array} jml
	 * @param {function} filter
	 * @return {array} JsonML
	 */
	JsonML.toXMLText = function(jml, filter) {
		return renderXML( toXML(jml, filter) );
	};

	/* Reverse conversion -------------------------*/

	var addChildren = function(/*DOM*/ elem, /*function*/ filter, /*JsonML*/ jml) {
		if (elem.hasChildNodes()) {
			for (var i=0, len=elem.childNodes.length; i<len; i++) {
				var child = elem.childNodes[i];
				child = fromXML(child, filter);
				if (child) {
					jml.push(child);
				}
			}
			return true;
		}
		return false;
	};

	/**
	 * @param {Node} elem
	 * @param {function} filter
	 * @return {string|array} JsonML
	 */
	var fromXML = JsonML.fromXML = function(elem, filter) {
		if (!elem || !elem.nodeType) {
			// free references
			return (elem = null);
		}

		var i, jml;
		switch (elem.nodeType) {
			case 1:  // element
			case 9:  // document
			case 11: // documentFragment
				jml = [elem.tagName||''];

				var attr = elem.attributes,
					props = {},
					hasAttrib = false;

				for (i=0; attr && i<attr.length; i++) {
					if (attr[i].specified) {
						if ('string' === typeof attr[i].value) {
							props[attr[i].name] = attr[i].value;
						}
						hasAttrib = true;
					}
				}
				if (hasAttrib) {
					jml.push(props);
				}

				addChildren(elem, filter, jml);

				// filter result
				if ('function' === typeof filter) {
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
				jml = ['!'];

				var type = ['DOCTYPE', (elem.name || 'html').toLowerCase()];

				if (elem.publicId) {
					type.push('PUBLIC', '"' + elem.publicId + '"');
				}

				if (elem.systemId) {
					type.push('"' + elem.systemId + '"');
				}

				jml.push(type.join(' '));

				// filter result
				if ('function' === typeof filter) {
					jml = filter(jml, elem);
				}

				// free references
				elem = null;
				return jml;
			case 8: // comment node
				if ((elem.nodeValue||'').indexOf('DOCTYPE') !== 0) {
					// free references
					elem = null;
					return null;
				}

				jml = ['!',
						elem.nodeValue];

				// filter result
				if ('function' === typeof filter) {
					jml = filter(jml, elem);
				}

				// free references
				elem = null;
				return jml;
			default: // etc.
				if (window.console) {
					window.console.log('nodeType '+elem.nodeType+' skipped.');
				}
				// free references
				return (elem = null);
		}
	};

	/**
	 * Converts XML text to XML DOM nodes
	 * https://developer.mozilla.org/en-US/docs/Parsing_and_serializing_XML
	 * https://gist.github.com/553364
	 * @param {string} xmlText
	 * @return {Node} xml node
	 */
	var parseXML = JsonML.parseXML = function(xmlText) {
		if (!xmlText || typeof xmlText !== 'string') {
			return null;
		}

		if (window.DOMParser) {
			// standard XML DOM
			return new DOMParser().parseFromString(xmlText, 'application/xml');
		}

		if (window.ActiveXObject) {
			// legacy IE XML DOM
			var xml = new ActiveXObject('Microsoft.XMLDOM');
			xml.async = 'false';
			xml.loadXML(xmlText);
			return xml;
		}
/*
		// this doesn't seem to work in any browser yet
		if (window.XMLHttpRequest){
			var xhr = new XMLHttpRequest();
			xhr.open('GET', 'data:application/xml;charset=utf-8,'+encodeURIComponent(xmlText), false);
			if (xhr.overrideMimeType) {
				xhr.overrideMimeType('application/xml');
			}
			xhr.send('');
			return xhr.responseXML;
		}
*/
		return null;
	};

	/**
	 * Converts XML text nodes to JsonML
	 * @param {string} xmlText
	 * @param {function} filter
	 * @return {string|array} JsonML
	 */
	JsonML.fromXMLText = function(xmlText, filter) {
		var elem = parseXML(xmlText);
		elem = elem && (elem.ownerDocument || elem).documentElement;

		return fromXML(elem, filter);
	};

	/**
	 * Converts XML DOM nodes to XML text
	 * https://developer.mozilla.org/en-US/docs/Parsing_and_serializing_XML
	 * @param {string} xmlText
	 * @return {string|array} JsonML
	 */
	var renderXML = JsonML.renderXML = function(elem) {
		if (!elem) {
			return null;
		}

		if (window.XMLSerializer) {
			// standard XML DOM
			return new window.XMLSerializer().serializeToString(elem);
		}

		// legacy IE XML
		if (elem.xml) {
			return elem.xml;
		}

		// HTML DOM
		if (elem.outerHTML) {
			return elem.outerHTML;
		}

		var parent = createElement('div');
		parent.appendChild(elem);

		var html = parent.innerHTML;
		parent.removeChild(elem);

		return html;
	};

	JsonML.isXML = function(elem) {
		var root = elem && (elem.ownerDocument || elem).documentElement;
		return !!root && (root.nodeName !== "HTML");
	};

	// enable usage of XML DOM, fallback to HTML DOM
	document = parseXML('<xml/>') || document;

})(JsonML, document);
