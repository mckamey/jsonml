/*
	jsonml-utils.js
	JsonML manipulation methods

	Created: 2006-11-09-0116
	Modified: 2012-11-03-2051

	Copyright (c)2006-2012 Stephen M. McKamey
	Distributed under The MIT License: http://jsonml.org/license

	This file ensures a global JsonML object adding these utility methods for manipulating JsonML elements:

		// tests if a given object is a valid JsonML element
		bool JsonML.isElement(jml);

		// gets the name of a JsonML element
		string JsonML.getTagName(jml);

		// tests if a given object is a JsonML attributes collection
		bool JsonML.isAttributes(jml);

		// tests if a JsonML element has a JsonML attributes collection
		bool JsonML.hasAttributes(jml);

		// gets the attributes collection for a JsonML element
		object JsonML.getAttributes(jml);

		// sets multiple attributes for a JsonML element
		void JsonML.addAttributes(jml, attr);

		// gets a single attribute for a JsonML element
		object JsonML.getAttribute(jml, key);

		// sets a single attribute for a JsonML element
		void JsonML.setAttribute(jml, key, value);

		// appends a JsonML child node to a parent JsonML element
		void JsonML.appendChild(parent, child);

		// gets an array of the child nodes of a JsonML element
		array JsonML.getChildren(jml);
*/

var JsonML = JsonML || {};

if (typeof module === 'object') {
	module.exports = JsonML;
}

(function(JsonML) {
	'use strict';

	/* Utility Methods -------------------------*/

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
	 * @param {*} jml
	 * @return {boolean}
	 */
	JsonML.isFragment = function(jml) {
		return isArray(jml) && (jml[0] === '');
	};

	/**
	 * @param {*} jml
	 * @return {string}
	 */
	JsonML.getTagName = function(jml) {
		return jml[0] || '';
	};

	/**
	 * @param {*} jml
	 * @return {boolean}
	 */
	var isElement = JsonML.isElement = function(jml) {
		return isArray(jml) && ('string' === typeof jml[0]);
	};

	/**
	 * @param {*} jml
	 * @return {boolean}
	 */
	var isAttributes = JsonML.isAttributes = function(jml) {
		return !!jml && ('object' === typeof jml) && !isArray(jml);
	};

	/**
	 * @param {*} jml
	 * @return {boolean}
	 */
	var hasAttributes = JsonML.hasAttributes = function(jml) {
		if (!isElement(jml)) {
			throw new SyntaxError('invalid JsonML');
		}

		return isAttributes(jml[1]);
	};

	/**
	 * @param {*} jml
	 * @param {boolean} addIfMissing
	 * @return {object}
	 */
	var getAttributes = JsonML.getAttributes = function(jml, addIfMissing) {
		if (hasAttributes(jml)) {
			return jml[1];
		}

		if (!addIfMissing) {
			return undefined;
		}

		// need to add an attribute object
		var name = jml.shift();
		var attr = {};
		jml.unshift(attr);
		jml.unshift(name||'');
		return attr;
	};

	/**
	 * @param {*} jml
	 * @param {object} attr
	 */
	var addAttributes = JsonML.addAttributes = function(jml, attr) {
		if (!isElement(jml) || !isAttributes(attr)) {
			throw new SyntaxError('invalid JsonML');
		}

		if (!isAttributes(jml[1])) {
			// just insert attributes
			var name = jml.shift();
			jml.unshift(attr);
			jml.unshift(name||'');
			return;
		}

		// merge attribute objects
		var old = jml[1];
		for (var key in attr) {
			if (attr.hasOwnProperty(key)) {
				old[key] = attr[key];
			}
		}
	};

	/**
	 * @param {*} jml
	 * @param {string} key
	 * @return {string|number|boolean}
	 */
	JsonML.getAttribute = function(jml, key) {
		if (!hasAttributes(jml)) {
			return undefined;
		}
		return jml[1][key];
	};

	/**
	 * @param {*} jml
	 * @param {string} key
	 * @param {string|number|boolean} value
	 */
	JsonML.setAttribute = function(jml, key, value) {
		getAttributes(jml, true)[key] = value;
	};

	/**
	 * @param {*} jml
	 * @param {array|object|string} child
	 */
	var appendChild = JsonML.appendChild = function(parent, child) {
		if (!isArray(parent)) {
			throw new SyntaxError('invalid JsonML');
		}

		if (isArray(child) && child[0] === '') {
			// result was multiple JsonML sub-trees (i.e. documentFragment)
			child.shift();// remove fragment ident

			// directly append children
			while (child.length) {
				appendChild(parent, child.shift(), arguments[2]);
			}

		} else if (child && 'object' === typeof child) {
			if (isArray(child)) {
				if (!isElement(child)) {
					throw new SyntaxError('invalid JsonML');
				}

				if (typeof arguments[2] === 'function') {
					// onAppend callback for JBST use
					(arguments[2])(parent, child);
				}

				// result was a JsonML node
				parent.push(child);

			} else if (JsonML.isRaw(child)) {

				// result was a JsonML node
				parent.push(child);

			} else {
				// result was JsonML attributes
				addAttributes(parent, child);
			}

		} else if ('undefined' !== typeof child && child !== null) {

			// must convert to string or JsonML will discard
			child = String(child);

			// skip processing empty string literals
			if (child && parent.length > 1 && 'string' === typeof parent[parent.length-1]) {
				// combine strings
				parent[parent.length-1] += child;
			} else if (child || !parent.length) {
				// append
				parent.push(child);
			}
		}
	};

	/**
	 * @param {*} jml
	 * @return {array}
	 */
	JsonML.getChildren = function(jml) {
		if (hasAttributes(jml)) {
			return jml.slice(2);
		}

		return jml.slice(1);
	};

})(JsonML);
