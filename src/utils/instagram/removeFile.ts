import { unlink } from "node:fs";

function removeFiles(paths: string[]) {
	return paths.forEach((path) =>
		unlink(path, (err) => {
			if (err) throw err;
		})
	);
}

export default removeFiles;
