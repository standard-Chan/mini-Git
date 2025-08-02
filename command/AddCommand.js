import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import GitUtil from '../GitUtil.js';
import GitPaths from '../GitPaths.js';
import { FILE_MODE } from '../constants.js';

export default class AddCommand {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPaths = GitPaths.of(rootPath);
    this.gitUtil = GitUtil.getInstance();
  }

  add(filePath) {
    const fileMode = this.#getFileMode(filePath);

    // 디렉토리인 경우 특별 처리
    if (fileMode === FILE_MODE.DIR) {
      console.error(
        chalk.red(`디렉토리 '${chalk.yellow(filePath)}'는 추가할 수 없습니다.\n`)
      );
      return;
    }

    const fileContent = this.gitUtil.readFile(filePath);
    const shaHash = this.gitUtil.getSha1Hash(fileContent); // 해시값
    const compressed = this.compress(fileContent); // content 압축

    this.saveBlob(shaHash, compressed); // file 저장
    this.saveToIndex(shaHash, fileMode, filePath); // index 파일 정보 추가

    console.log(
      chalk.green('✓ ') +
      `${chalk.greenBright(filePath)} 가 staged 되었습니다. ` +
      `hash id : ${chalk.yellow(shaHash)}\n`
    );
  }

  /** blob 파일 저장하기 */
  saveBlob(filename, content) {
    const blobDir = path.join(this.gitPaths.objectsPath, filename.slice(0, 2));
    const blobPath = path.join(blobDir, filename);

    if (!fs.existsSync(blobDir)) {
      fs.mkdirSync(blobDir, { recursive: true });
    }

    fs.writeFileSync(blobPath, content);
  }

  /** 파일 모드 얻기 */
  #getFileMode(filePath) {
    const stat = fs.lstatSync(filePath);

    if (stat.isFile()) return FILE_MODE.EXE;
    if (stat.isDirectory()) return FILE_MODE.DIR;
    if (stat.isSymbolicLink()) return FILE_MODE.SYMBOL;
    return FILE_MODE.REGULAR;
  }

  /** index 파일에 맵핑 정보 저장하기 */
  saveToIndex(shaHash, fileMode, filePath) {
    const indexEntry = `${fileMode} ${shaHash} ${filePath}\n`;
    fs.appendFileSync(this.gitPaths.indexPath, indexEntry);
  }

  /** 내용을 압축하여 반환 */
  compress(content) {
    const compressedFormat = `blob ${content.length}\0${content}`;
    return this.gitUtil.compress(compressedFormat);
  }
}
