<?xml version="1.0" encoding="UTF-8" ?>
<!--
		JsonML.xsl
		2006-11-15

		This transformation converts any XML document into JsonML.
		It omits comment-nodes, processing-instructions, and the
		prefix for "http://www.w3.org/1999/xhtml" namespace since
		the assumption is that this for use with a web browser.

		http://jsonml.org
-->
<xsl:stylesheet version="1.0"
				xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
				xmlns:html="http://www.w3.org/1999/xhtml"
				exclude-result-prefixes="html">

	<xsl:output method="text"
				media-type="application/json"
				encoding="UTF-8"
				indent="no"
				omit-xml-declaration="yes" />

	<!-- Constants -->
	<xsl:variable name="START_ELEM"
				  select="'['" />

	<xsl:variable name="XHTML"
				  select="'http://www.w3.org/1999/xhtml'" />

	<xsl:variable name="END_ELEM"
				  select="']'" />

	<xsl:variable name="VALUE_DELIM"
				  select="','" />

	<xsl:variable name="START_ATTRIB"
				  select="'{'" />

	<xsl:variable name="END_ATTRIB"
				  select="'}'" />

	<xsl:variable name="NAME_DELIM"
				  select="':'" />

	<xsl:variable name="STRING_DELIM"
				  select="'&quot;'" />

	<!-- text-nodes -->
	<xsl:template match="text()">
		<xsl:call-template name="escape-string">
			<xsl:with-param name="value"
							select="." />
		</xsl:call-template>
	</xsl:template>

	<!-- attribute -->
	<xsl:template match="@*">
		<xsl:value-of select="$STRING_DELIM"
					  disable-output-escaping="yes"/>
		<xsl:choose>
			<xsl:when test="namespace-uri()=$XHTML">
				<xsl:value-of select="local-name()"
							  disable-output-escaping="yes"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="name()"
							  disable-output-escaping="yes"/>
			</xsl:otherwise>
		</xsl:choose>
		<xsl:value-of select="$STRING_DELIM"
					  disable-output-escaping="yes"/>

		<xsl:value-of select="$NAME_DELIM"
					  disable-output-escaping="yes"/>

		<xsl:call-template name="escape-string">
			<xsl:with-param name="value"
							select="." />
		</xsl:call-template>

	</xsl:template>

	<!-- element -->
	<xsl:template match="*">
		<xsl:value-of select="$START_ELEM"
					  disable-output-escaping="yes"/>

		<!-- tag-name string -->
		<xsl:value-of select="$STRING_DELIM"
					  disable-output-escaping="yes"/>
		<xsl:choose>
			<xsl:when test="namespace-uri()=$XHTML">
				<xsl:value-of select="local-name()"
							  disable-output-escaping="yes"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="name()"
							  disable-output-escaping="yes"/>
			</xsl:otherwise>
		</xsl:choose>
		<xsl:value-of select="$STRING_DELIM"
					  disable-output-escaping="yes"/>

		<!-- attribute object -->
		<xsl:if test="count(@*)>0">
			<xsl:value-of select="$VALUE_DELIM"
						  disable-output-escaping="yes"/>
			<xsl:value-of select="$START_ATTRIB"
						  disable-output-escaping="yes"/>
			<xsl:for-each select="@*">
				<xsl:if test="position()>1">
					<xsl:value-of select="$VALUE_DELIM"
								  disable-output-escaping="yes"/>
				</xsl:if>
				<xsl:apply-templates select="." />
			</xsl:for-each>
			<xsl:value-of select="$END_ATTRIB"
						  disable-output-escaping="yes"/>
		</xsl:if>

		<!-- child elements and text-nodes -->
		<xsl:if test="count(./*)+count(./text())>0">
			<xsl:value-of select="$VALUE_DELIM"
						  disable-output-escaping="yes"/>
			<xsl:for-each select="./*|./text()">
				<xsl:if test="position()>1">
					<xsl:value-of select="$VALUE_DELIM"
								  disable-output-escaping="yes"/>
				</xsl:if>
				<xsl:apply-templates select="." />
			</xsl:for-each>
		</xsl:if>

		<xsl:value-of select="$END_ELEM"
					  disable-output-escaping="yes"/>
	</xsl:template>

	<!-- escape-string: quotes and escapes -->
	<xsl:template name="escape-string">
		<xsl:param name="value" />

		<xsl:value-of select="$STRING_DELIM"
					  disable-output-escaping="yes"/>

		<xsl:if test="string-length($value)>0">
			<xsl:variable name="escaped-whacks">
				<!-- escape backslashes -->
				<xsl:call-template name="string-replace">
					<xsl:with-param name="value"
									select="$value" />
					<xsl:with-param name="find"
									select="'\'" />
					<xsl:with-param name="replace"
									select="'\\'" />
				</xsl:call-template>
			</xsl:variable>

			<xsl:variable name="escaped-LF">
				<!-- escape line feeds -->
				<xsl:call-template name="string-replace">
					<xsl:with-param name="value"
									select="$escaped-whacks" />
					<xsl:with-param name="find"
									select="'&#x0A;'" />
					<xsl:with-param name="replace"
									select="'\n'" />
				</xsl:call-template>
			</xsl:variable>

			<xsl:variable name="escaped-CR">
				<!-- escape carriage returns -->
				<xsl:call-template name="string-replace">
					<xsl:with-param name="value"
									select="$escaped-LF" />
					<xsl:with-param name="find"
									select="'&#x0D;'" />
					<xsl:with-param name="replace"
									select="'\r'" />
				</xsl:call-template>
			</xsl:variable>

			<xsl:variable name="escaped-tabs">
				<!-- escape tabs -->
				<xsl:call-template name="string-replace">
					<xsl:with-param name="value"
									select="$escaped-CR" />
					<xsl:with-param name="find"
									select="'&#x09;'" />
					<xsl:with-param name="replace"
									select="'\t'" />
				</xsl:call-template>
			</xsl:variable>

			<!-- escape quotes -->
			<xsl:call-template name="string-replace">
				<xsl:with-param name="value"
								select="$escaped-tabs" />
				<xsl:with-param name="find"
								select="'&quot;'" />
				<xsl:with-param name="replace"
								select="'\&quot;'" />
			</xsl:call-template>
		</xsl:if>

		<xsl:value-of select="$STRING_DELIM"
					  disable-output-escaping="yes"/>
	</xsl:template>

	<!-- string-replace: replaces occurances of one string with another -->
	<xsl:template name="string-replace">
		<xsl:param name="value" />
		<xsl:param name="find" />
		<xsl:param name="replace" />

		<xsl:choose>
			<xsl:when test="contains($value,$find)">
				<!-- replace and call recursively on next -->
				<xsl:value-of select="substring-before($value,$find)"
							  disable-output-escaping="yes" />
				<xsl:value-of select="$replace"
							  disable-output-escaping="yes" />
				<xsl:call-template name="string-replace">
					<xsl:with-param name="value"
									select="substring-after($value,$find)" />
					<xsl:with-param name="find"
									select="$find" />
					<xsl:with-param name="replace"
									select="$replace" />
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<!-- no replacement necessary -->
				<xsl:value-of select="$value"
							  disable-output-escaping="yes" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

</xsl:stylesheet>