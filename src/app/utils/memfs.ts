
import { FileChangeType, FileType, IWatchOptions, IStat, FileSystemProviderErrorCode, FileSystemProviderError, FileWriteOptions, IFileChange, FileDeleteOptions, FileOverwriteOptions, IFileSystemProviderWithFileReadWriteCapability } from './file';
import { URI } from './uri' 
import * as path from 'path'
class File implements IStat {
	type: FileType;
	ctime: number;
	mtime: number;
	size: number;

	name: string;
	data?: string;

	constructor(name: string) {
		this.type = FileType.File;
		this.ctime = Date.now();
		this.mtime = Date.now();
		this.size = 0;
		this.name = name;
	}
}

class Directory implements IStat {

	type: FileType;
	ctime: number;
	mtime: number;
	size: number;

	name: string;
	entries: Map<string, File | Directory>;

	constructor(name: string) {
		this.type = FileType.Directory;
		this.ctime = Date.now();
		this.mtime = Date.now();
		this.size = 0;
		this.name = name;
		this.entries = new Map();
	}
}

export type Entry = File | Directory;

export default class InMemoryFileSystemProvider implements IFileSystemProviderWithFileReadWriteCapability {

  root = new Directory('');
	// --- manage file metadata

	async stat(resource: URI, silent:boolean = false): Promise<IStat> {
		return this._lookup(resource, silent);
	}

	async readdir(resource: URI): Promise<[string, FileType][]> {
		const entry = this._lookupAsDirectory(resource, false);
		let result: [string, FileType][] = [];
		for (const [name, child] of entry.entries) {
			result.push([name, child.type]);
		}
		return result;
	}

	// --- manage file contents

	async readFile(resource: URI, silent: boolean = false): Promise<string> {
		const data = this._lookupAsFile(resource, silent).data;
		if (data) {
			return data;
		}
		throw new FileSystemProviderError('file not found', FileSystemProviderErrorCode.FileNotFound);
	}

	async writeFile(resource: URI, content: string, opts: FileWriteOptions): Promise<void> {
		let basename = this._basename(resource.path);
		let parent = this._lookupParentDirectory(resource);
		let entry = parent.entries.get(basename);
		if (entry instanceof Directory) {
			throw new FileSystemProviderError('file is directory', FileSystemProviderErrorCode.FileIsADirectory);
		}
		if (!entry && !opts.create) {
			throw new FileSystemProviderError('file not found', FileSystemProviderErrorCode.FileNotFound);
		}
		if (entry && opts.create && !opts.overwrite) {
			throw new FileSystemProviderError('file exists already', FileSystemProviderErrorCode.FileExists);
		}
		if (!entry) {
			entry = new File(basename);
			parent.entries.set(basename, entry);
			this._fireSoon({ type: FileChangeType.ADDED, resource });
		}
		entry.mtime = Date.now();
		entry.size = 0;
		entry.data = content;

		this._fireSoon({ type: FileChangeType.UPDATED, resource });
	}

	// --- manage files/folders

	async rename(from: URI, to: URI, opts: FileOverwriteOptions): Promise<void> {
		if (!opts.overwrite && this._lookup(to, true)) {
			throw new FileSystemProviderError('file exists already', FileSystemProviderErrorCode.FileExists);
		}

		let entry = this._lookup(from, false);
		let oldParent = this._lookupParentDirectory(from);

		let newParent = this._lookupParentDirectory(to);
		let newName = this._basename(to.path);

		oldParent.entries.delete(entry.name);
		entry.name = newName;
		newParent.entries.set(newName, entry);

		this._fireSoon(
			{ type: FileChangeType.DELETED, resource: from },
			{ type: FileChangeType.ADDED, resource: to }
		);
	}

	async delete(resource: URI): Promise<void> {
		let dirname = resource.with({
			path: this._dirname(resource.path)
		});
		let basename = this._basename(resource.path);
		let parent = this._lookupAsDirectory(dirname, false);
		if (!parent.entries.has(basename)) {
			throw new FileSystemProviderError('file not found', FileSystemProviderErrorCode.FileNotFound);
		}
		parent.entries.delete(basename);
		parent.mtime = Date.now();
		parent.size -= 1;
		this._fireSoon({ type: FileChangeType.UPDATED, resource: dirname }, { resource, type: FileChangeType.DELETED });
	}

	async mkdir(resource: URI): Promise<void> {
		let basename = this._basename(resource.path);
		let dirname = resource.with({
			path: this._dirname(resource.path)
		});
		let parent = this._lookupAsDirectory(dirname, false);

		let entry = new Directory(basename);
		parent.entries.set(entry.name, entry);
		parent.mtime = Date.now();
		parent.size += 1;
		this._fireSoon({ type: FileChangeType.UPDATED, resource: dirname }, { type: FileChangeType.ADDED, resource });
	}
	async walk(callback: (entry: File, filepath: string, isADirectory: boolean) => Promise<any>) {
		if(typeof callback !== 'function') {
			throw new Error('walk callback must be function');
		}
	  async function walk(root: Entry, parentPath: string): Promise<any> {
			await callback(root, path.join(parentPath, root.name), root instanceof Directory);
			if(root instanceof Directory && root.entries) {
				await Promise.all(Array.from(root.entries.values()).map((entry: Entry) => {
					return walk(entry, path.join(parentPath, root.name));
				}))
			}
		}
		walk(this.root, '');
	}

	// --- lookup

	private _lookup(uri: URI, silent: false): Entry;
	private _lookup(uri: URI, silent: boolean): Entry | undefined;
	private _lookup(uri: URI, silent: boolean): Entry | undefined {
		let parts = uri.path.split('/');
		let entry: Entry = this.root;
		for (const part of parts) {
			if (!part) {
				continue;
			}
			let child: Entry | undefined;
			if (entry instanceof Directory) {
				child = entry.entries.get(part);
			}
			if (!child) {
				if (!silent) {
					throw new FileSystemProviderError('file not found', FileSystemProviderErrorCode.FileNotFound);
				} else {
					return undefined;
				}
			}
			entry = child;
		}
		return entry;
	}

	private _lookupAsDirectory(uri: URI, silent: boolean): Directory {
		let entry = this._lookup(uri, silent);
		if (entry instanceof Directory) {
			return entry;
		}
		throw new FileSystemProviderError('file not a directory', FileSystemProviderErrorCode.FileNotADirectory);
	}

	private _lookupAsFile(uri: URI, silent: boolean): File {
		let entry = this._lookup(uri, silent);
		if (entry instanceof File) {
			return entry;
		}
		throw new FileSystemProviderError('file is a directory', FileSystemProviderErrorCode.FileIsADirectory);
	}

	private _lookupParentDirectory(uri: URI): Directory {
		const dirname = this._dirname(uri.path);
		return this._lookupAsDirectory(uri.with({
			path: dirname
		}), false);
	}

	// --- manage file events

	private _bufferedChanges: IFileChange[] = [];
	private _fireSoonHandle?: any;

	private _fireSoon(...changes: IFileChange[]): void {
		this._bufferedChanges.push(...changes);

		if (this._fireSoonHandle) {
			clearTimeout(this._fireSoonHandle);
		}

		this._fireSoonHandle = setTimeout(() => {
			this._bufferedChanges.length = 0;
		}, 5);
	}
	private _basename(path: string): string {
		path = this._rtrim(path, '/');
		if (!path) {
			return '';
		}

		return path.substr(path.lastIndexOf('/') + 1);
	}

	private _dirname(path: string): string {
		path = this._rtrim(path, '/');
		if (!path) {
			return '/';
		}

		return path.substr(0, path.lastIndexOf('/'));
	}

	private _rtrim(haystack: string, needle: string): string {
		if (!haystack || !needle) {
			return haystack;
		}

		const needleLen = needle.length,
			haystackLen = haystack.length;

		if (needleLen === 0 || haystackLen === 0) {
			return haystack;
		}

		let offset = haystackLen,
			idx = -1;

		while (true) {
			idx = haystack.lastIndexOf(needle, offset - 1);
			if (idx === -1 || idx + needleLen !== offset) {
				break;
			}
			if (idx === 0) {
				return '';
			}
			offset = idx;
		}

		return haystack.substring(0, offset);
	}
}