'use strict';

(function() {
	var Awisp,
		$,
		emptyArray = [],
		slice = emptyArray.slice,
		fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    	singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    	tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    	rootNodeRE = /^(?:body|html)$/i,
    	capitalRE = /([A-Z])/g,
    	table = document.createElement('table'),
    	tableRow = document.createElement('tr'),
    	containers = {
      		'tr': document.createElement('tbody'),
      		'tbody': table, 'thead': table, 'tfoot': table,
      		'td': tableRow, 'th': tableRow,
      		'*': document.createElement('div')
    	},
    	readyRE = /complete|loaded|interactive/,
    	simpleSelectorRE = /^[\w-]*$/,
    	class2type = {},
    	toString = class2type.toString,
		awisp = {},
		isArray = Array.isArray ||
      		function(object){ return object instanceof Array };

	awisp.fragment = function(html, name, properties) {
    	var dom, nodes, container;

    	// A special case optimization for a single tag
    	if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1));

    	if (!dom) {
      		if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>");
      		if (name === undefined) name = fragmentRE.test(html) && RegExp.$1;
      		if (!(name in containers)) name = '*';

      		container = containers[name];
      		container.innerHTML = '' + html;
      		dom = $.each(slice.call(container.childNodes), function(){
        		container.removeChild(this);
      		});
    	}

    	if (isPlainObject(properties)) {
      		nodes = $(dom);
      		$.each(properties, function(key, value) {
        		if (methodAttributes.indexOf(key) > -1) nodes[key](value);
        		else nodes.attr(key, value);
      		});
    	}

    	return dom;
  	};

  	awisp.qsa = function(element, selector){
    	var found,
        	maybeID = selector[0] == '#',
        	maybeClass = !maybeID && selector[0] == '.',
        	nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        	isSimple = simpleSelectorRE.test(nameOnly);
    
    	return (isDocument(element) && isSimple && maybeID) ?
      		( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      		(element.nodeType !== 1 && element.nodeType !== 9) ? [] :
      		slice.call(
        		isSimple && !maybeID ?
          			maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
          			element.getElementsByTagName(selector) : // Or a tag
          			element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      		)
  	};

	awisp.A = function(dom, selector) {
    	dom = dom || [];
    	dom.__proto__ = $.fn;
    	dom.selector = selector || '';
    	return dom;
  	};

  	awisp.isA = function(object) {
    	return object instanceof awisp.A;
  	};

	awisp.init = function(selector, context) {
    	var dom;

    	// If nothing given, return an empty Awisp collection
    	if (!selector) return awisp.A();

    	// Optimize for string selectors
    	else if (typeof selector == 'string') {
      		selector = selector.trim();

	      	// If it's a html fragment, create nodes from it
	      	// Note: In both Chrome 21 and Firefox 15, DOM error 12
	      	// is thrown if the fragment doesn't begin with <
	      	if (selector[0] == '<' && fragmentRE.test(selector))
	        	dom = awisp.fragment(selector, RegExp.$1, context), selector = null;
	      	
	      	// If there's a context, create a collection on that context first, and select
	      	// nodes from there
	      	else if (context !== undefined) return $(context).find(selector);
	      	
	      	// If it's a CSS selector, use it to select nodes.
	      	else dom = awisp.qsa(document, selector);
    	}
    
	    // If a function is given, call it when the DOM is ready
	    else if (isFunction(selector)) return $(document).ready(selector);
	    
	    // If a Awipe collection is given, just return it
	    else if (awisp.isA(selector)) return selector;
	    else {
	      	
	      	// normalize array if an array of nodes is given
	      	if (isArray(selector)) dom = compact(selector);
	      
	      	// Wrap DOM nodes.
	      	else if (isObject(selector))
	        	dom = [selector], selector = null;
	      	
	      	// If it's a html fragment, create nodes from it
	      	else if (fragmentRE.test(selector))
	        	dom = awisp.fragment(selector.trim(), RegExp.$1, context), selector = null;
	      
	      	// If there's a context, create a collection on that context first, and select
	      	// nodes from there
	      	else if (context !== undefined) return $(context).find(selector);
	      	
	      	// And last but no least, if it's a CSS selector, use it to select nodes.
	      	else dom = awisp.qsa(document, selector);
	    }
    	// create a new Awisp collection from the nodes found
    	return awisp.A(dom, selector);
  	}

  	$ = function(selector, context){
    	return awisp.init(selector, context);
  	}

	/**
	 * constructor
	 * @param { documentElement }, selector
	 */
	Awisp = function(selector, context){
    	return awisp.init(selector, context);
  	}

	window.Awisp = Awisp;
	window.$ === undefined && (window.$ = Awisp);

	$.type = type;
    $.isFunction = isFunction;
    $.isWindow = isWindow;
    $.isArray = isArray;
    $.isPlainObject = isPlainObject;

  	$.isEmptyObject = function(obj) {
    	var name;
    	for (name in obj) return false;
    	return true;
  	};

  	$.inArray = function(elem, array, i){
    	return emptyArray.indexOf.call(array, elem, i);
  	};

  	$.camelCase = camelize;
  	
  	$.trim = function(str) {
    	return str == null ? "" : String.prototype.trim.call(str);
  	};

  	// plugin compatibility
  	$.uuid = 0;
  	$.support = { };
  	$.expr = { };

  	$.map = function(elements, callback){
    	var value, values = [], i, key;
    	if (likeArray(elements))
      		for (i = 0; i < elements.length; i++) {
        		value = callback(elements[i], i);
        		if (value != null) values.push(value);
      		}
    	else
      	for (key in elements) {
        	value = callback(elements[key], key)
        	if (value != null) values.push(value)
      	}
    	return flatten(values)
  	}

  	$.each = function(elements, callback){
    	var i, key
    	if (likeArray(elements)) {
      		for (i = 0; i < elements.length; i++)
        		if (callback.call(elements[i], i, elements[i]) === false) return elements
    			} else {
      				for (key in elements)
        				if (callback.call(elements[key], key, elements[key]) === false) return elements
   		}

    	return elements
  	}

  	$.grep = function(elements, callback){
    	return filter.call(elements, callback)
  	}

  	if (window.JSON) $.parseJSON = JSON.parse

  	// Populate the class2type map
  	$.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    	class2type[ "[object " + name + "]" ] = name.toLowerCase()
  	})

	$.fn = {

    	// Because a collection acts like an array
    	// copy over these useful array functions.
    	forEach: emptyArray.forEach,
    	reduce: emptyArray.reduce,
    	push: emptyArray.push,
    	sort: emptyArray.sort,
    	indexOf: emptyArray.indexOf,
    	concat: emptyArray.concat,

	    // `map` and `slice` in the jQuery API work differently
	    // from their array counterparts
	    map: function(fn){
	      	return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
	    },

	    slice: function(){
	      	return $(slice.apply(this, arguments))
	    },

    	ready: function(callback){
      		// need to check if document.body exists for IE as that browser reports
      		// document ready when it hasn't yet created the body element
      		if (readyRE.test(document.readyState) && document.body) callback($)
      		else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
      		return this
    	},

    	get: function(idx){
      		return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    	},

    	toArray: function(){ return this.get() },
    
    	size: function(){
      		return this.length
    	},

    	remove: function(){
      		return this.each(function() {
        		if (this.parentNode != null)
          			this.parentNode.removeChild(this)
      		})
    	},

    	each: function(callback){
      		emptyArray.every.call(this, function(el, idx){
        		return callback.call(el, idx, el) !== false
      		})
      		return this
    	},
    
    	eq: function(idx){
      		return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    	},

    	first: function(){
      		var el = this[0]
      		return el && !isObject(el) ? el : $(el)
    	},

    	last: function(){
      		var el = this[this.length - 1]
      		return el && !isObject(el) ? el : $(el)
    	},

    	contents: function() {
      		return this.map(function() { return slice.call(this.childNodes) })
    	},
    	
    	empty: function(){
      		return this.each(function(){ this.innerHTML = '' })
    	},
    
    	show: function(){
      		return this.each(function(){
        		this.style.display == "none" && (this.style.display = '')
        		if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          		this.style.display = defaultDisplay(this.nodeName)
      		})
    	},
    
    	clone: function(){
      		return this.map(function(){ return this.cloneNode(true) })
    	},
    
    	hide: function(){
      		return this.css("display", "none")
    	},

    	toggle: function(setting){
      		return this.each(function(){
        		var el = $(this)
        		;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
      		})
    	},

    	attr: function(name, value){
      		var result
      		return (typeof name == 'string' && !(1 in arguments)) ?
        		(!this.length || this[0].nodeType !== 1 ? undefined :
          		(!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        	) :
        	this.each(function(idx){
          		if (this.nodeType !== 1) return
          		if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          		else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        	})
    	},

    	removeAttr: function(name){
      		return this.each(function(){ this.nodeType === 1 && setAttribute(this, name) })
    	},

    	val: function(value){
      		return 0 in arguments ?
        	this.each(function(idx){
          		this.value = funcArg(this, value, idx, this.value)
        	}) :
        	(this[0] && (this[0].multiple ?
           		$(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') :
           		this[0].value)
        	)
    	},

    	css: function(property, value){
      		if (arguments.length < 2) {
        		var element = this[0], computedStyle = getComputedStyle(element, '')
        		if(!element) return
        		if (typeof property == 'string')
          			return element.style[camelize(property)] || computedStyle.getPropertyValue(property)
        		else if (isArray(property)) {
          			var props = {}
		          	$.each(isArray(property) ? property: [property], function(_, prop){
		            	props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
		          	})
          			return props
        		}
      		}

      		var css = ''
      		if (type(property) == 'string') {
        		if (!value && value !== 0)
          			this.each(function(){ this.style.removeProperty(dasherize(property)) })
        		else
          			css = dasherize(property) + ":" + maybeAddPx(property, value)
      		} else {
        		for (key in property)
          			if (!property[key] && property[key] !== 0)
            			this.each(function(){ this.style.removeProperty(dasherize(key)) })
          			else
            			css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      				}

      			return this.each(function(){ this.style.cssText += ';' + css })
    	},

    	index: function(element){
      		return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    	}
  	};

  	function funcArg(context, arg, idx, payload) {
    	return isFunction(arg) ? arg.call(context, idx, payload) : arg
  	}

  	function setAttribute(node, name, value) {
    	value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  	}
  	
  	function type(obj) {
    	return obj == null ? String(obj) :
      		class2type[toString.call(obj)] || "object"
  	}

  	function isFunction(value) { return type(value) == "function" }
  	function isWindow(obj)     { return obj != null && obj == obj.window }
  	function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  	function isObject(obj)     { return type(obj) == "object" }
  	function isPlainObject(obj) {
    	return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  	}
  	function likeArray(obj) { return typeof obj.length == 'number' }
    function camelize(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
  	function compact(array) { return filter.call(array, function(item){ return item != null }) }
  	function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
  	function classRE(name) {
    	return name in classCache ?
      		classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  	}
  	function maybeAddPx(name, value) {
    	return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  	}
  	function dasherize(str) {
    	return str.replace(/::/g, '/')
           	.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           	.replace(/([a-z\d])([A-Z])/g, '$1_$2')
           	.replace(/_/g, '-')
           	.toLowerCase()
  	}

})();
