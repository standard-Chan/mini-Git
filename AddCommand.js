import path from 'path';
import fs from 'fs';
import GitUtil from './GitUtil.js';
import { FILE_MODE } from './constants.js';

export default class AddCommand {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPath = path.join(rootPath, ".git");

    this.objectsPath = path.join(this.gitPath, "objects");
    this.headPath = path.join(this.gitPath, "HEAD");
    this.refsHeadsPath = path.join(this.gitPath, "refs", "heads");
    this.indexPath = path.join(this.gitPath, "index");

    this.gitUtil = GitUtil.getInstance();
  }

  add(filePath) {
    const fileContent = this.gitUtil.readFile(filePath);
    const fileMode = this.#getFileMode(filePath);
    const shaHash = this.gitUtil.getSha1Hash(fileContent); // 해시값

    const compressed = this.compress(shaHash); // content 압축

    this.saveBlob(shaHash, compressed) // file 저장
    this.saveToIndex(shaHash, fileMode, filePath); // index 파일 정보 에 추가 (스태이징)

    console.log(`add : '${filePath}"' 가 staged 되었습니다.`)
  }

  /** blob 파일 저장하기 */
  saveBlob(filename, content) {
    // 앞 2글자로 디렉토리 생성하기
    const blobDir = path.join(this.objectsPath, filename.slice(0, 2));
    const blobPath = path.join(blobDir, filename);

    // 디렉토리 생성 (ex: objects/{hash값 앞 2글자}/{hash값})
    if (!fs.existsSync(blobDir)) {
      fs.mkdirSync(blobDir, { recursive: true });
    }

    fs.writeFileSync(blobPath, content);
  }

  /** 파일 모드 얻기 */
  #getFileMode(filePath) {
    const stat = fs.lstatSync(filePath); // 파일 유형 얻기

    if (stat.isFile()) {
      return FILE_MODE.EXE;
    }

    if (stat.isDirectory()) {
      return FILE_MODE.DIR;
    }

    if (stat.isSymbolicLink()) {
      return FILE_MODE.SYMBOL;
    }

    return FILE_MODE.REGULAR;
  }

  /** index 파일에 맵핑 정보 저장하기 
   * 저장 형태 : {파일모드} {해시값} {루트 - 상대경로}
  */
  saveToIndex(shaHash, fileMode, filePath) {

    const indexEntry = `${fileMode} ${shaHash} ${filePath}\n`;

    fs.appendFileSync(this.indexPath, indexEntry);
  }

  /** 내용을 압축하여 반환 */
  compress(content) {
    const compressedFormat = `blob ${content.length}\0${content}`;
    return this.gitUtil.compress(compressedFormat);
  }
}