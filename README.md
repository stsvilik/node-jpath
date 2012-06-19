node-jPath
====
Utility library to help you traverse and filter out data from complex JSON and or Arrays of objects.
The strength of this library lies in ability to use XPath-like expressions to retrieve data you need.

How is it different from XPath?
---
Because we're dealing with javascript, I felt that syntax should inherit some of that syntactical sugar that we're all used to when coding JavaScript
and that is why the pattern syntax uses dots(.) instead of slashes. One thing that jPath lacks in comparisson with XPath is ability to look for conditions "anywhere" within a structure (i.e. //foo), this operation is just too expensive.

How does it work?
---
jPath is a recursive scanner that processes each token of your pattern at a time passing the results of the findings back to itself. As it runs conditions to match the values, it tries to match value types on the left and right sides of the equasion (aples to aples, oranges to oranges). Results of the traversal are merged into a single Array.

Examples
---
	var jsonData = {
		people: [
			{name: "John", age:26, gender:"male"},
			{name: "Steve", age:24, gender:"male"},
			{name: "Susan", age:22, gender:"female"},
			{name: "Linda", age:30, gender:"female"},
			{name: "Adam", age:32, gender:"male"}
		]
	};
	//We want to get all males younger then 25
	var match = jpath.filter(jsonData, "people[gender=male && age < 25]");

Output:
	[{name: "Steve", age:24, gender:"male"}]

	//Now lets try to get people that have a 5 letter name
	var match = jpath.filter(jsonData, "people[name.length == 5]");

Output:
	[{name: "Steve", age:24, gender:"male"},{name: "Susan", age:22, gender:"female"},{name: "Linda", age:30, gender:"female"}]

	//I want to get only names of people as an array of strings
	var match = jpath.filter(jsonData, "people.name");

Output:
	["John", "Steve", "Susan", "Linda", "Adam"]

	//I need to get people that have gender (in our case all of them will, but in case field is missing this operation is useful)
	var match = jpath.filter(jsonData, "people[name != undefined]");


Supported Operators
---
* "==" or "=" - compares data member for equality
* "!=" - compares data member inequality
* "<" - less than
* ">" - greater than
* "<=" - less or equal
* ">=" - greater or equal
* "~=" - equal ignoring case
* "^=" - starts with
* "$=" - ends with
* "*=" - contains a string anywhere inside
* "!*" - does NOT contain a string anywhere in the value
* "?" - allows you to pass a custom evaluation function

You can also reverse condition for any of the operations by wrapping them in "!(...)". 

## Example:
	var match = jpath.filter(jsonData, "people[!(name ^= A)]"); //This will find all names that do NOT start with "A"

Working with Arrays
---
Working with Arrays requires a special character to reference Array itself in the expression, for this we'll use "\*".
## Example:
	var people = [
		{name: "John", age:26, gender:"male"},
		{name: "Steve", age:24, gender:"male"},
		{name: "Susan", age:22, gender:"female"},
		{name: "Linda", age:30, gender:"female"},
		{name: "Adam", age:32, gender:"male"}
	];
	var match = jpath.filter(people, "*[gender==female]");
Output:
	[{name: "Susan", age:22, gender:"female"},{name: "Linda", age:30, gender:"female"}]

API
---
jPath exposes two methods: filter() and select(). select method returns an instance of JPath object that allows you to do alot more then just get results of the pattern match.

### Classes

* JPath
	* constructor( json ) - initializes JPath instance
	* data - local copy of json object you passed in during init.
	* selection - cached result of the selection
	* from( json ) - this method allows you to change json source
	* first() - returns the first result value
	* last() - returns the last result value
	* eq( index ) - returns result value by index
	* select( pattern [, custom_compare_function ]) - performs recursive search
	* and( pattern ) - this method allows combining of multiple search results.
	* val() - <Array> returns the final value of selection

### Methods

select( json, expression ) - performs a traversal and returns you an instance of JPath object

filter( json, expression ) - performs a traversal and returns a value

