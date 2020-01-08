import { URI } from './uri';
/**
 * Possible changes that can occur to a file.
 */
export const enum FileChangeType {
	UPDATED = 0,
	ADDED = 1,
	DELETED = 2
}
export interface FileOverwriteOptions {
	overwrite: boolean;
}

export interface FileReadStreamOptions {

	/**
	 * Is an integer specifying where to begin reading from in the file. If position is undefined,
	 * data will be read from the current file position.
	 */
	readonly position?: number;

	/**
	 * Is an integer specifying how many bytes to read from the file. By default, all bytes
	 * will be read.
	 */
	readonly length?: number;

	/**
	 * If provided, the size of the file will be checked against the limits.
	 */
	limits?: {
		readonly size?: number;
		readonly memory?: number;
	};
}

export interface FileWriteOptions {
	overwrite: boolean;
	create: boolean;
}

export interface FileOpenOptions {
	create: boolean;
}

export interface FileDeleteOptions {
	recursive: boolean;
	useTrash: boolean;
}

export enum FileType {
	Unknown = 0,
	File = 1,
	Directory = 2,
	SymbolicLink = 64
}

export interface IStat {
	type: FileType;

	/**
	 * The last modification date represented as millis from unix epoch.
	 */
	mtime: number;

	/**
	 * The creation date represented as millis from unix epoch.
	 */
	ctime: number;

	size: number;
}

export interface IWatchOptions {
	recursive: boolean;
	excludes: string[];
}

export const enum FileSystemProviderCapabilities {
	FileReadWrite = 1 << 1,
	FileOpenReadWriteClose = 1 << 2,
	FileReadStream = 1 << 4,

	FileFolderCopy = 1 << 3,

	PathCaseSensitive = 1 << 10,
	Readonly = 1 << 11,

	Trash = 1 << 12
}

export interface IFileSystemProvider {
	stat(resource: URI): Promise<IStat>;
	mkdir(resource: URI): Promise<void>;
	readdir(resource: URI): Promise<[string, FileType][]>;
	delete(resource: URI, opts: FileDeleteOptions): Promise<void>;

	rename(from: URI, to: URI, opts: FileOverwriteOptions): Promise<void>;

	readFile?(resource: URI): Promise<string | string>;
	writeFile?(resource: URI, content: string, opts: FileWriteOptions): Promise<void>;

	open?(resource: URI, opts: FileOpenOptions): Promise<number>;
	close?(fd: number): Promise<void>;
	read?(fd: number, pos: number, data: string, offset: number, length: number): Promise<number>;
	write?(fd: number, pos: number, data: string, offset: number, length: number): Promise<number>;
}
/**
 * Identifies a single change in a file.
 */
export interface IFileChange {

	/**
	 * The type of change that occurred to the file.
	 */
	readonly type: FileChangeType;

	/**
	 * The unified resource identifier of the file that changed.
	 */
	readonly resource: URI;
}

export enum FileSystemProviderErrorCode {
	FileExists = 'EntryExists',
	FileNotFound = 'EntryNotFound',
	FileNotADirectory = 'EntryNotADirectory',
	FileIsADirectory = 'EntryIsADirectory',
	FileExceedsMemoryLimit = 'EntryExceedsMemoryLimit',
	FileTooLarge = 'EntryTooLarge',
	NoPermissions = 'NoPermissions',
	Unavailable = 'Unavailable',
	Unknown = 'Unknown'
}

export class FileSystemProviderError extends Error {

	constructor(message: string, public readonly code: FileSystemProviderErrorCode) {
		super(message);
	}
}

export interface IFileSystemProviderWithFileReadWriteCapability extends IFileSystemProvider {
	readFile(resource: URI): Promise<string | string>;
	writeFile(resource: URI, content: string, opts: FileWriteOptions): Promise<void>;
}

export class NotImplementedError extends Error {
	constructor(message?: string) {
		super('NotImplemented');
		if (message) {
			this.message = message;
		}
	}
}