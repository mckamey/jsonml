/*global JsonML, Reponse, System */
/*
	JsonML_ASP.js

	Created: 2008-08-31-2206
	Modified: 2008-08-31-2206

	Copyright (c)2006-2009 Stephen M. McKamey
	Distributed under an open-source license: http://jsonml.org/license
*/

if ("undefined" === typeof window.Reponse) {
	window.Reponse = {};
}

/*legacy ASP/JSP adapter*/
Response.Write = Response.write = function(/*string*/ value) {
	return JsonML.raw(value);
};
