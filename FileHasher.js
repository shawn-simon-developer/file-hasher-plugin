'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const walk = require('walk');
const shell = require('shelljs');

class FileHasher {

	constructor(options) {
		this.options = options;
		this._fileMap = {};
	}

	_getOutputDirName() {
		return this.options.outputDir || '.static';
	}

	_getRootPathTo(fileOrDir) {
		return `${process.env.PWD}/${fileOrDir}`;
	}

	_getProjectPathTo(fileOrDir) {
		return path.resolve(__dirname, fileOrDir);
	}

	_mkdir(dir) {
		if (!fs.existsSync(this._getRootPathTo(dir))) {
			fs.mkdirSync(this._getRootPathTo(dir));
		}
	}

	_deleteFolderRecursive(pathToFolder) {
		const self = this;
		if (fs.existsSync(pathToFolder)) {
			fs.readdirSync(pathToFolder).forEach((file) => {
				const curPath = `${pathToFolder}/${file}`;
				if (fs.lstatSync(curPath).isDirectory()) { // recurse
					self._deleteFolderRecursive(curPath);
				} else { // delete file
					fs.unlinkSync(curPath);
				}
			});
			fs.rmdirSync(pathToFolder);
		}
	}

	_outputPathWith(fileName) {
		if (fileName) {
			return `${this._getRootPathTo(this._getOutputDirName())}/${fileName}`;
		}
		return this._getRootPathTo(this._getOutputDirName());
	}

	_hashAndMove(file) {
		const data = fs.readFileSync(file.path, 'utf8');
		const hash = crypto.createHash('md5').update(data).digest('hex');
		const newFileName = `${hash}.${file.name}`;
		if (!fs.existsSync(file.outputPath)) {
			shell.mkdir('-p', `${file.outputPath}`);
		}
		fs.writeFileSync(`${file.outputPath}${newFileName}`, data);
		this._fileMap[file.name] = {
			newFileName,
			filePath: file.path,
			newFilePath: `${this._getOutputDirName()}/${newFileName}`,
		};
	}

	_createFileMap() {
		const fileMapPath = this._outputPathWith('fileMap.json');
		fs.writeFileSync(fileMapPath, JSON.stringify(this._fileMap));
	}

	_hashFiles() {
		this.options.files.forEach(file => {
			this._hashAndMove(file);
		});
	}

	_convertDirectoryToFileStructure() {
		const walkerOptions = {
			followLinks: false,
			listeners: {
				file: (root, fileStats, next) => {
					if (!this.options.filters.includes(fileStats.name)) {
						this.options.files.push({
							name: fileStats.name,
							path: `${root}/${fileStats.name}`,
							outputPath: `${this._getOutputDirName()}${root.replace(this.options.directory, '')}/`,
						});
					}
					next();
				},
			},
		};
		walk.walkSync(this.options.directory, walkerOptions);
	}

	_onDone(compiler) {
		this._deleteFolderRecursive(this._getOutputDirName());
		compiler.plugin('done', () => {
			this._mkdir(this._getOutputDirName());
			if (this.options.directory) {
				this.options.files = [];
				this._convertDirectoryToFileStructure();
				this._hashFiles();
			}
			this._hashFiles();
			this._createFileMap();
		});
	}

	apply(compiler) {
		this._onDone(compiler);
	}
}

module.exports = FileHasher;
