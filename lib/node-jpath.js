// node-jpath.js - is a library that allows filtering of JSON data based on pattern-like expressions
(function(Array, undef) {
	var
		TRUE        = !0,
		FALSE       = !1,
		UNDEF       = "undefined",
		STRING      = "string",
		PERIOD      = ".",

		rxTokens    = new RegExp("([A-Za-z0-9_\\*@\\$\\-]+(?:\\[.+?\\])?)", "g"),
		rxIndex     = new RegExp("(\\S+)\\[(\\d+)\\]"),
		rxPairs     = new RegExp("([\\w@\\.]+)\\s*([><=]=?|[~\\^\\$\\!\\*]=|\\?|!\\*)\\s*([@\\w\\s_\\'$\\.\\+-\\/\\:]+)(\\s*|$)", "g"),
		rxCondition = new RegExp("(\\S+)\\[(.+)\\]"),

		app         = Array.prototype.push,
		apc         = Array.prototype.concat,
		/**
		 * Private API
		 * @type {Object}
		 */
		hidden = {
			/**
			 * Converts an object into an Array if it isn't
			 * @param  {Object} o 	Any type of object
			 * @return {Array}   	Array of an object or an empty Array
			 */
			toArray: function(o) {
				return o instanceof Array ? o : (o === undef || o === null) ? [] : [o];
			},
			/**
			 * Recursive function that walks through an object, extracting pattern matches
			 * @param  {String} pattern 	jPath expression
			 * @param  {Function} cfn     	Callback function used to run a custom comparisson
			 * @param  {Object|Array} obj   An object or an Array that will be scanned for matches
			 * @return {Array}         		Matching results
			 */
			traverse: function(pattern, cfn, obj) {
				var out, data = (obj || this.data),
					temp, tokens, token, idxToken, index, expToken, condition, tail, self = arguments.callee,
					found, i, j, l;
				if (data && typeof(pattern) === STRING) {
					tokens = pattern.match(rxTokens); //dot notation splitter
					//Get first token
					token = tokens[0];
					//Trailing tokens
					tail = tokens.slice(1).join(PERIOD);

					if (data instanceof Array) {
						temp = [];
						for (i = 0, l = data.length; l > i; i++) {
							j = data[i];
							found = self.apply(this, [token, cfn, j]);
							if (((found instanceof Array) && found.length) || found !== undef) {
								app.apply(temp, [found]);
							}
						}
						if (temp.length) {
							return tail ? self.apply(this, [tail, cfn, temp]) : temp;
						} else {
							return;
						}
					} else if (token === "*") {
						return tail ? self.apply(this, [tail, cfn, data]) : data;
					} else if (data[token] !== undef) {
						return tail ? self.apply(this, [tail, cfn, data[token]]) : data[token];
					} else if (rxIndex.test(token)) {
						idxToken = token.match(rxIndex);
						token = idxToken[1];
						index = +idxToken[2];
						return tail ? self.apply(this, [tail, cfn, data[token][index]]) : data[token][index];
					} else if (rxCondition.test(token)) {
						expToken = token.match(rxCondition);
						token = expToken[1];
						condition = expToken[2];

						var evalStr, isMatch, subset = token === "*" ? data : data[token],
							elem;

						if (subset instanceof Array) {
							temp = [];
							//Second loop here is faster than recursive call
							for (i = 0, l = subset.length; l > i; i++) {
								elem = subset[i];
								//Convert condition pairs to booleans
								evalStr = condition.replace(rxPairs, function($0, $1, $2, $3) {
									return hidden.testPairs.apply(elem, [$1, $3, $2, cfn]);
								});
								//Evaluate expression
								isMatch = eval(evalStr);
								if (isMatch) {
									app.apply(temp, [elem]);
								}
							}
							if (temp.length) {
								return tail ? self.apply(this, [tail, cfn, temp]) : temp;
							} else {
								return;
							}
						} else {
							elem = subset;
							//Convert condition pairs to booleans
							evalStr = condition.replace(rxPairs, function($0, $1, $2, $3) {
								return hidden.testPairs.apply(elem, [$1, $3, $2, cfn]);
							});
							//Evaluate expression
							isMatch = eval(evalStr);
							if (isMatch) {
								return tail ? self.apply(this, [tail, cfn, elem]) : elem;
							}
						}
					}
				}
				return out;
			},
			//Matches type of a to b
			matchTypes: function(a, b) {
				var _a, _b;
				switch (typeof(a)) {
				case "string":
					_b = b + '';
					break;
				case "boolean":
					_b = b === "true" ? TRUE : FALSE;
					break;
				case "number":
					_b = +b;
					break;
				case "date":
					_b = new Date(b).valueOf();
					_a = a.valueOf();
					break;
				default:
					_b = b;
				}
				if (b === "null") {
					_b = null;
				}
				if (b === "undefined") {
					_b = undef;
				}
				return {
					left: (_a || a),
					right: _b
				};
			},
			//Condition functions
			testPairs: (function() {
				var conditions = {
					"=": function(l, r) {
						return l === r;
					},
					"==": function(l, r) {
						return l === r;
					},
					"!=": function(l, r) {
						return l !== r;
					},
					"^=": function(l, r) {
						return !((l + '').indexOf(r));
					},
					"<": function(l, r) {
						return l < r;
					},
					"<=": function(l, r) {
						return l <= r;
					},
					">": function(l, r) {
						return l > r;
					},
					">=": function(l, r) {
						return l >= r;
					},
					"~=": function(l, r) {
						return (l + '').toLowerCase() === (r + '').toLowerCase();
					},
					"$=": function(l, r) {
						return new RegExp(r + "$", "i").test(l);
					},
					"*=": function(l, r) {
						return (l + '').indexOf(r) >= 0;
					}
				};

				return function(left, right, operator, fn) {
					var out = FALSE,
						leftVal = left.indexOf(PERIOD) !== -1 ? hidden.traverse(left, null, this) : this[left],
						pairs = hidden.matchTypes(leftVal, right.trim());
					if (operator === "?") {
						if (typeof(fn) === "function") {
							out = fn.call(this, pairs.left, right);
						}
					} else {
						out = conditions[operator](pairs.left, pairs.right);
					}
					return out;
				};
			})(),
			/**
			 * Merges results of sibling nodes into a single Array
			 * @param  {String} pattern 	String pattern or results
			 * @return {Array}         		Concatinated results
			 */
			merge: function(pattern) {
				var out = [],
					temp = hidden.toArray(pattern ? hidden.traverse.apply(this, arguments) : this.selection);
				out = apc.apply([], temp);
				return out;
			}
		};
	/**
	 * JPath Class
	 * @param {Object|Array} obj Search subject
	 */

	function JPath(obj) {
		if (!(this instanceof JPath)) {
			return new JPath(obj);
		}
		this.data = obj || null;
		this.selection = [];
	}

	JPath.prototype = {
		/**
		 * Sets search subject (source of data)
		 * @param  {Object|Array} obj Search subject
		 * @return {this}
		 */
		from: function(obj) {
			this.data = obj;
			return this;
		},
		/**
		 * Returns a first match element
		 * @return {Var} Any type of object located in the first element of the result Array
		 */
		first: function() {
			return this.selection.length ? this.selection[0] : null;
		},
		/**
		 * Returns a last match element
		 * @return {Var} Any type of object located in the last element of the result Array
		 */
		last: function() {
			return this.selection.length ? this.selection.slice(-1)[0] : null;
		},
		/**
		 * Returns an exact match element located at idx position
		 * @param  {Number} idx Index
		 * @return {Var} Any type of object located in result Array[idx]
		 */
		eq: function(idx) {
			return this.selection.length ? this.selection[idx] : null;
		},
		/**
		 * Applies matching pattern to an object
		 * @param  {String} pattern  	jPath expression
		 * @param  {Function} cfn     	Custom comparisson function
		 * @param  {Object|Array} obj   Search subject object
		 * @return {this}
		 */
		select: function(pattern, cfn, obj) {
			this.selection = hidden.merge.apply(this, arguments);
			return this;
		},
		/**
		 * Merges additional pattern-matching results with existing ones
		 * @param  {String} pattern jPath expression
		 * @return {this}
		 */
		and: function(pattern) {
			this.selection = this.selection.concat(hidden.merge.apply(this, arguments));
			return this;
		},
		/**
		 * Returns all matches
		 * @return {Array}
		 */
		val: function() {
			return this.selection;
		}
	};

	//Extend module
	/**
	 * Runs a select filter against an object and returns an instance of a JPath object
	 * @param  {Object|Array} obj   Search subject
	 * @param  {String} pattern 	jPath expression
	 * @param  {Function} cfn     	Custom comparisson function (optional)
	 * @return {JPath}         		Instance of a JPath object pre-filled with results
	 */
	module.exports.select = function(obj, pattern, cfn) {
		return JPath(obj).select(pattern, cfn, null);
	};
	/**
	 * Returns results of the pattern-matching as an Array
	 * @param  {Object|Array} obj   Search subject
	 * @param  {String} pattern 	jPath expression
	 * @param  {Function} cfn     	Custom comparisson function (optional)
	 * @return {Array}         		Search results
	 */
	module.exports.filter = function(obj, pattern, cfn) {
		return JPath(obj).select(pattern, cfn, null).val();
	};
})(Array);