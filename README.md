# Recollie
[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/roymcfarland/recollie?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This open source API allows you to tap into a list of car, drug, food, and product safety recalls. Recalls are searchable by keyword, issuing agency, vehicle-specific attribute, or any combination of these.

```
var recollie = require('recollie');

recollie(term, function(results){
	console.log(results);
});
```
