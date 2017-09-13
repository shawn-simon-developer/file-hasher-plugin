# File Hasher Plugin

The File Hasher Plugin allows you to either provide a list of specific files or an entire directory in which the File Hasher Plugin will create an md5 hash from the file contents and prefix the file name with the hash. This prevents the browser or server from caching the file when the content changes. The hashing will result in a new directory called `.static` which will reflect the original file structure unless otherwise stated.

Q: How is this different then webpack default hashing?

A: This plugin handles all the static files that otherwise wouldn't run through your default webpack transpile.

Example:
```
myFile.js -> 4d26ba0bb7990a1fe2bba61225c6dfd9.myFile.js
```

## Getting Started

To get started, add the File Hasher Plugin to your webpack config:
```
// Directory Style:
plugins: [
  new FileHasher({
    outputDir: '.static',
    directory: 'src/app/static',
    filters: ['.DS_Store'],
  }),
],
```
```
// Individual Files:
plugins: [
	new FileHasher({
	 files: [
		 {
          name: 'appdynamics.js',
          path: 'src/app/static/appdynamics.js',
          outputPath: 'possible/new/path/'
		 },
	 ],
   }),
],
```

### Prerequisites

Node >= 6.0.x
