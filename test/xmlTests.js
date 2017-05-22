/*global JsonML, module, test, same */
try{

module('jsonml-xml.js');

test('JsonML.parseXML/.renderXML roundtrip', function() {

	var expected =
		'<catalog>'+
			'<book id="bk101">'+
				'<author>Gambardella, Matthew</author>'+
					'<title>XML Developer\'s Guide</title>'+
			'</book>'+
			'<book id="bk102">'+
				'<author>Ralls, Kim</author>'+
				'<title>Midnight Rain</title>'+
			'</book>'+
		'</catalog>';

	var dom = JsonML.parseXML(expected);
	var actual = JsonML.renderXML(dom);

	same(actual, expected);
});

test('JsonML.fromXMLText', function() {

	var expected =
		['catalog',
			['book', { id: 'bk101' },
				['author', 'Gambardella, Matthew'],
				['title', 'XML Developer\'s Guide']
			],
			['book', { id: 'bk102' },
				['author', 'Ralls, Kim'],
				['title', 'Midnight Rain']
			]
		];

	var input =
		'<catalog>'+
			'<book id="bk101">'+
				'<author>Gambardella, Matthew</author>'+
					'<title>XML Developer\'s Guide</title>'+
			'</book>'+
			'<book id="bk102">'+
				'<author>Ralls, Kim</author>'+
				'<title>Midnight Rain</title>'+
			'</book>'+
		'</catalog>';

	var actual = JsonML.fromXMLText(input);

	same(actual, expected);
});

test('JsonML.fromXML', function() {

	var expected =
		['a',
			['b', { b1k: 'b1v' },
				['c', 'c1'],
				['d', 'd1']
			],
			['b', { b2k: 'b2v' },
				['c', 'c2'],
				['d', 'd2']
			]
		];

	// hack needed to get an XML document
	var xmlDoc = JsonML.parseXML('<xml/>');

	var input = xmlDoc.createElement('a');
	input.appendChild(xmlDoc.createElement('b'));
	input.firstChild.setAttribute('b1k', 'b1v');
	input.firstChild.appendChild(xmlDoc.createElement('c'));
	input.firstChild.firstChild.appendChild(xmlDoc.createTextNode('c1'));
	input.firstChild.appendChild(xmlDoc.createElement('d'));
	input.firstChild.lastChild.appendChild(xmlDoc.createTextNode('d1'));
	input.appendChild(xmlDoc.createElement('b'));
	input.lastChild.setAttribute('b2k', 'b2v');
	input.lastChild.appendChild(xmlDoc.createElement('c'));
	input.lastChild.firstChild.appendChild(xmlDoc.createTextNode('c2'));
	input.lastChild.appendChild(xmlDoc.createElement('d'));
	input.lastChild.lastChild.appendChild(xmlDoc.createTextNode('d2'));

	var actual = JsonML.fromXML(input);

	same(actual, expected);
});

test('JsonML.fromXML, namespaces', function() {

	var expected =
		['a', { xmlns: 'http://ns.example.com', 'xmlns:foo': 'http://ns.example.com/foo' },
			['foo:b', { b1k: 'b1v' },
				['c', 'c1'],
				['d', 'd1']
			],
			['foo:b', { b2k: 'b2v' },
				['c', 'c2'],
				['d', 'd2']
			]
		];

	// hack needed to get an XML document
	var xmlDoc = JsonML.parseXML('<xml/>');

	var input = xmlDoc.createElement('a');
	input.setAttribute('xmlns', 'http://ns.example.com');
	input.setAttribute('xmlns:foo', 'http://ns.example.com/foo');
	input.appendChild(xmlDoc.createElement('foo:b'));
	input.firstChild.setAttribute('b1k', 'b1v');
	input.firstChild.appendChild(xmlDoc.createElement('c'));
	input.firstChild.firstChild.appendChild(xmlDoc.createTextNode('c1'));
	input.firstChild.appendChild(xmlDoc.createElement('d'));
	input.firstChild.lastChild.appendChild(xmlDoc.createTextNode('d1'));
	input.appendChild(xmlDoc.createElement('foo:b'));
	input.lastChild.setAttribute('b2k', 'b2v');
	input.lastChild.appendChild(xmlDoc.createElement('c'));
	input.lastChild.firstChild.appendChild(xmlDoc.createTextNode('c2'));
	input.lastChild.appendChild(xmlDoc.createElement('d'));
	input.lastChild.lastChild.appendChild(xmlDoc.createTextNode('d2'));

	var actual = JsonML.fromXML(input);

	same(actual, expected);
});

test('JsonML.toXMLText', function() {

	var expected =
		'<catalog>'+
			'<book id="bk101">'+
				'<author>Gambardella, Matthew</author>'+
					'<title>XML Developer\'s Guide</title>'+
			'</book>'+
			'<book id="bk102">'+
				'<author>Ralls, Kim</author>'+
				'<title>Midnight Rain</title>'+
			'</book>'+
		'</catalog>';

	var input =
		['catalog',
			['book', { id: 'bk101' },
				['author', 'Gambardella, Matthew'],
				['title', 'XML Developer\'s Guide']
			],
			['book', { id: 'bk102' },
				['author', 'Ralls, Kim'],
				['title', 'Midnight Rain']
			]
		];

	var actual = JsonML.toXMLText(input);

	same(actual, expected);
});

test('JsonML.toXMLText, namespaces', function() {

	var expected =
		'<catalog xmlns="http://ns.example.com" xmlns:foo="http://ns.example.com/foo">'+
			'<foo:book id="bk101">'+
				'<author>Gambardella, Matthew</author>'+
					'<title>XML Developer\'s Guide</title>'+
			'</foo:book>'+
			'<foo:book id="bk102">'+
				'<author>Ralls, Kim</author>'+
				'<title>Midnight Rain</title>'+
			'</foo:book>'+
		'</catalog>';

	var input =
		['catalog', { xmlns: 'http://ns.example.com', 'xmlns:foo': 'http://ns.example.com/foo' },
			['foo:book', { id: 'bk101' },
				['author', 'Gambardella, Matthew'],
				['title', 'XML Developer\'s Guide']
			],
			['foo:book', { id: 'bk102' },
				['author', 'Ralls, Kim'],
				['title', 'Midnight Rain']
			]
		];

	var actual = JsonML.toXMLText(input);

	same(actual, expected);
});

test('JsonML.toXML', function() {

	// hack needed to get an XML document
	var xmlDoc = JsonML.parseXML('<xml/>');

	var expected = xmlDoc.createElement('a');
	expected.appendChild(xmlDoc.createElement('b'));
	expected.firstChild.setAttribute('b1k', 'b1v');
	expected.firstChild.appendChild(xmlDoc.createElement('c'));
	expected.firstChild.firstChild.appendChild(xmlDoc.createTextNode('c1'));
	expected.firstChild.appendChild(xmlDoc.createElement('d'));
	expected.firstChild.lastChild.appendChild(xmlDoc.createTextNode('d1'));
	expected.appendChild(xmlDoc.createElement('b'));
	expected.lastChild.setAttribute('b2k', 'b2v');
	expected.lastChild.appendChild(xmlDoc.createElement('c'));
	expected.lastChild.firstChild.appendChild(xmlDoc.createTextNode('c2'));
	expected.lastChild.appendChild(xmlDoc.createElement('d'));
	expected.lastChild.lastChild.appendChild(xmlDoc.createTextNode('d2'));

	var input =
		['a',
			['b', { b1k: 'b1v' },
				['c', 'c1'],
				['d', 'd1']
			],
			['b', { b2k: 'b2v' },
				['c', 'c2'],
				['d', 'd2']
			]
		];

	var actual = JsonML.toXML(input);

	// must compare strings or will get security exception
	same(JsonML.renderXML(actual), JsonML.renderXML(expected));
});

test('JsonML.fromXMLText/.toXMLText roundtrip', function() {

	var expected =
		'<catalog>'+
			'<product description="Cardigan Sweater">'+
			'<catalog_item gender="Men\'s">'+
				'<item_number>QWZ5671</item_number>'+
				'<price>39.95</price>'+
				'<size description="Medium">'+
					'<color_swatch image="red_cardigan.jpg">Red</color_swatch>'+
					'<color_swatch image="burgundy_cardigan.jpg">Burgundy</color_swatch>'+
				'</size>'+
				'<size description="Large">'+
					'<color_swatch image="red_cardigan.jpg">Red</color_swatch>'+
					'<color_swatch image="burgundy_cardigan.jpg">Burgundy</color_swatch>'+
				'</size>'+
			'</catalog_item>'+
			'<catalog_item gender="Women\'s">'+
				'<item_number>RRX9856</item_number>'+
				'<discount_until>Dec 25, 1995</discount_until>'+
				'<price>42.50</price>'+
				'<size description="Medium">'+
					'<color_swatch image="black_cardigan.jpg">Black</color_swatch>'+
				'</size>'+
			'</catalog_item>'+
			'</product>'+
		'</catalog>';

	// JsonML will strip the XML Declaration
	var input = '<?xml version="1.0"?>' + expected;

	var jml = JsonML.fromXMLText(input);
	var actual = JsonML.toXMLText(jml);

	same(actual, expected);
});

test('JsonML.fromXMLText/.toXMLText roundtrip, namespaces', function() {

	var expected =
		'<catalog xmlns="http://ns.example.com" xmlns:foo="http://foo.example.org">'+
			'<product description="Cardigan Sweater">'+
			'<catalog_item gender="Men\'s">'+
				'<item_number>QWZ5671</item_number>'+
				'<price>39.95</price>'+
				'<foo:size description="Medium">'+
					'<color_swatch image="red_cardigan.jpg">Red</color_swatch>'+
					'<color_swatch image="burgundy_cardigan.jpg">Burgundy</color_swatch>'+
				'</foo:size>'+
				'<foo:size description="Large">'+
					'<color_swatch image="red_cardigan.jpg">Red</color_swatch>'+
					'<color_swatch image="burgundy_cardigan.jpg">Burgundy</color_swatch>'+
				'</foo:size>'+
			'</catalog_item>'+
			'<catalog_item gender="Women\'s">'+
				'<item_number>RRX9856</item_number>'+
				'<discount_until>Dec 25, 1995</discount_until>'+
				'<price>42.50</price>'+
				'<foo:size description="Medium">'+
					'<color_swatch image="black_cardigan.jpg">Black</color_swatch>'+
				'</foo:size>'+
			'</catalog_item>'+
			'</product>'+
		'</catalog>';

	// JsonML will strip the XML Declaration
	var input = '<?xml version="1.0"?>' + expected;

	var jml = JsonML.fromXMLText(input);
	var actual = JsonML.toXMLText(jml);

	same(actual, expected);
});

test('JsonML.fromXMLText/.toXMLText roundtrip, CDATA', function() {

	var expected =
		'<foo>'+
			'<script type="text/javascript">function matchwo(a,b) {'+
				'if (a &lt; b &amp;&amp; a &lt; 0) { return 1; }'+
				'else { return 0; }'+
			'}</script>'+
		'</foo>';

	var input =
		'<foo>'+
			'<script type="text/javascript"><![CDATA[function matchwo(a,b) {'+
				'if (a < b && a < 0) { return 1; }'+
				'else { return 0; }'+
			'}]]></script>'+
		'</foo>';

	var jml = JsonML.fromXMLText(input);
	var actual = JsonML.toXMLText(jml);

	same(actual, expected);
});

test('JsonML.fromXMLText/.toXMLText roundtrip, comments', function() {

	var expected = '<foo/>';

	var input =
		'<foo>'+
			'<!-- this is a comment -->'+
		'</foo>';

	var jml = JsonML.fromXMLText(input);
	var actual = JsonML.toXMLText(jml);

	same(actual, expected);
});

test('JsonML.fromXMLText/.toXMLText roundtrip, processing instructions', function() {

	var expected =
		'<?some-pi and its data?>' +
		'<foo>' +
			'<?another-pi with data?>' +
		'</foo>';

	// JsonML will strip the XML Declaration
	var input = '<?xml version="1.0"?>' + expected;

	var jml = JsonML.fromXMLText(input);
	var actual = JsonML.toXMLText(jml);

	same(actual, expected);
});

}catch(ex){alert(ex);}
