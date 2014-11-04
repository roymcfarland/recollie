# Recollie

This recollie API allows you to tap into a list of car, drug, food, and product safety recalls. Recalls are searchable by keyword, issuing agency, vehicle-specific attribute(s), or any combination of these.

```
var recollie = require('recollie');

recollie(term, function(results){
	console.log(results);
});
```
