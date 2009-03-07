/*global JsonML, Reponse, System */
/*
	JsonML_JSP.js

	Created: 2008-08-31-2206
	Modified: 2008-08-31-2206

	Copyright (c)2006-2009 Stephen M. McKamey
	Distributed under an open-source license: http://jsonml.org/license
*/

if ("undefined" === typeof window.System) {
	window.System = {};
}
if ("undefined" === typeof window.System) {
	System.out = {};
}

/*legacy JSP adapter*/
System.out.print = System.out.println = function(/*string*/ value) {
	return JsonML.raw(value);
};
