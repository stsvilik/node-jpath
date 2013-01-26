node-jPath
====
Utility library to help you traverse and filter out data from complex JSON and or Arrays of objects.
The strength of this library lies in ability to use XPath-like expressions to retrieve data you need.

#### How is it different from XPath?

Because we're dealing with javascript, I felt that syntax should inherit some of that syntactical sugar that we're all used to when coding JavaScript
and that is why the pattern syntax uses dots(.) instead of slashes. One thing that jPath lacks in comparisson with XPath is ability to look for conditions "anywhere" within a structure (i.e. //foo), this operation is just too expensive.

#### How does it work?

jPath is a recursive scanner that processes each token of your pattern at a time passing the results of the findings back to itself. As it runs conditions to match the values, it tries to match value types on the left and right sides of the equasion (apples to apples, oranges to oranges). Results of the traversal are merged into a single Array.

#### Install

	npm install node-jpath

#### Examples

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
	var match = jpath.filter(jsonData, "people[gender != undefined]");


#### Does it support conditions?

Just like XPATH, it does support conditional filtering, where you basically specify what nodes you want to retrieve
based on certain condition. Conditional queries work by comparing data members to value you provide inside your
expression (it does not do comparing between data members). So for example if you have an array of objects and you want
to get only those objects where member foo = 1, you would write "obj[foo == 1]", more examples later. It supports a
wide range of evaluations.

- "==" | "=" - compares data member for equality
- "!=" - compares data member inequality
- "<" - less than
- ">" - greater than
- "<=" - less or equal
- ">=" - greater or equal
- "~=" - equal ignoring case
- "^=" - starts with
- "$=" - ends with
- "*=" - contains a string anywhere inside (case insensitive)
- "?" - allows you to pass a custom evaluation function (runs in the scope of evaluated object so you can compare against other object members).

During the comparing stage, all values are type matched (coerced) to the types of values you're comparing against.
What this means is that you always compare numbers against numbers and not strings, and same goes for every other data
type.

If your value contains a space, you can enclose your value in single or double quotes. (i.e. [foo == 'hello world']) Normally you
don't have to do that. If your value contains quotes, you can escape them using double slashes (i.e [foo == 'Bob\\\'s']).

#### What else can it do?

One thing to note is that there is a special "*" selector that references an object itself, so you may use it lets say
against an array of objects (i.e. *[ foo == bah] - will return rows where member foo has value bah). You can also have
"deep" value comparing (i.e. obj[ foo.bah == "wow"] ). Now that you can do deep value comparing, you can also check for
native properties such as "length" (i.e. obj( [ name.length > 3 ]) ). You can also reverse condition for any of the operations by wrapping them in "!(...)".

#### Using reserved words to compare

JPath supports the use of 'null' and 'undefined' in conditions.
So if you're traversing an array of objects where your object may NOT contain a member you can always write *[foo == undefined].

#### What is not here

- JPath does not support "select-all" syntax of XPATH that allowed you to find something anywhere in the XML document. This is too expensive in JavaScript.
- JPath does not natively supports conditions that compare one data memeber against another, but this can be achieved using "a ? b" and the use of "this" in the custom comparator.

#### Working with Arrays

Working with Arrays requires a special character to reference Array itself in the expression, for this we'll use "\*".
#### Example:
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
	* val() - {Array} returns the final value of selection

### Methods

* select( json, expression [,cust_compare_fn] ) - performs a traversal and returns you an instance of JPath object
* filter( json, expression [,cust_compare_fn] ) - performs a traversal and returns a value

#### More Examples

1. Using Custom compare logic

        jPath.filter( JSON, "foo[bar ? test]", function(left, right) {
            //left - is the value of the data member bar inside foo
            //right - would be equal to "test"
            return left + "blah" == right; //Cusom validation
        });

2. Joining multiple filtering results

        jPath.select( JSON, "foo[bar == 1]").and( "foo2[bar == 2]").val(); //This example adds to the selection a different pattern evaluation

    Example above could also be written like so:

        jPath.select( JSON, "foo[bar == 1 || bar == 2]").val();

3. If we want to combine results from different JSON objects, than we would do something like so:

        jPath.select( JSON, "foo[bar == 1]").from(JSON2).and( "foo2[bar == 2]").val(); //from() sets a different source of data

4. Accessing array elements by index

        jPath.select({myArray:[1,2,3,4,5]}, "myArray(0)");

5. Using parenteces to group logic

        jPath.filter(obj, "*[(a==b || a == c) && c == d]");
