# rescue-wikieva

This utility extracts the content from the [wikieva-archive](https://github.com/Provitaonline/wikieva-archive) leaf files and generates json equivalents.

The ```wikieva-archive``` directory needs to be a sibling directory to the ```rescue-wikieva``` directory

First, run ```./list_species.sh > files.txt``` to generate list of files to parse

Then, run ```node parse-files.js```

The ```output``` directory will contain the result.
