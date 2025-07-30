import path from 'path';
import fs from 'fs';
import GitUtil from './GitUtil.js';
import { FILE_MODE } from './constants.js';

export default class Commit {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPath = path.join(rootPath, ".git");

    this.objectsPath = path.join(this.gitPath, "objects");
    this.headPath = path.join(this.gitPath, "HEAD");
    this.refsHeadsPath = path.join(this.gitPath, "refs", "heads");
    this.indexPath = path.join(this.gitPath, "index");

    this.gitUtil = GitUtil.getInstance();
  }

  commit() {

  }

  /** Tree 객체 생성 */
  createTree() {
    const indexEntries = this.readIndex();
    const DirEntires = this.convertToDirEntries(indexEntries);
    const TreeObjects = writeTreeContent(treeEntry);

    // 
  }

  /** index 파일을 읽고 파싱한다. [{fileMode, hash, filePath}, ... ]*/
  readIndex() {
    let indexEntries = []; // [{ fileMode, hash, filePath }, ...]
    const indexLines = this.gitUtil.readFile(this.indexPath, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean);

    indexLines.forEach(line => {
      const [fileMode, hash, filePath] = line.trim().split(' ');
      indexEntries.push({ fileMode, hash, filePath });
    });

    return indexEntries;
  }

  /** index를 다음 형태로 변환 [['디렉토리 경로', [content1, content2]], ...] 
   * ex. [ 'a/b/c', [{ fileMode: '100644', hash: 'a94a8f...', filePath: 'test.txt' }]] */
  convertToDirEntries(indexEntries) {
    const dirMap = new Map(); // key: 경로, value: Set(하위 항목들)

    for (const entry of indexEntries) {
      const parts = entry.filePath.split('/'); // 예: ['a', 'b', 'c', 'test.txt']
      const fullPaths = [];

      // 1. a, a/b, a/b/c, a/b/c/test.txt 형태로 누적 경로 생성
      for (let i = 0; i < parts.length; i++) {
        const joined = parts.slice(0, i + 1).join('/');
        fullPaths.push(joined);
      }

      // 2. 각 경로마다 Set 구성
      for (let i = 0; i < fullPaths.length - 1; i++) {
        const parent = fullPaths[i];
        const child = parts[i + 1]; // 다음 디렉토리 또는 파일 이름

        if (!dirMap.has(parent)) dirMap.set(parent, new Set());
        dirMap.get(parent).add(child);
      }

      // 3. 마지막 경로는 파일 정보 저장
      const fileDir = fullPaths[fullPaths.length - 2]; // 파일의 상위 디렉토리
      const fileName = parts[parts.length - 1];

      if (!dirMap.has(fileDir)) dirMap.set(fileDir, new Set());
      dirMap.get(fileDir).add({
        fileMode: entry.fileMode,
        hash: entry.hash,
        filePath: fileName,
      });
    }

    // 4. 역순 정렬: 하위 디렉토리부터 처리해야 상위에서 SHA 생성 시 참조 가능
    const sorted = this.sortDesc([...dirMap.entries()]);
    console.log("정렬된 트리 정보: ");
    console.log(sorted);

    return sorted;
  }

  writeTreeContent(treeEntry) {
    const [dirPath, children] = treeEntry; // 예: 'a/b/c', Set([...])

    const chunks = [];

    for (const child of children) {
      // 파일인 경우 (객체): { fileMode, hash, filePath }
      if (typeof child === 'object') {
        const { fileMode, hash, filePath } = child;

        // <mode> <filename>\0<hash (binary)>
        const header = `${fileMode} ${filePath}\0`;
        const headerBuffer = Buffer.from(header, 'utf-8');
        const hashBuffer = Buffer.from(hash, 'hex'); // SHA-1 해시를 hex → binary

        chunks.push(Buffer.concat([headerBuffer, hashBuffer]));
      }

      // 디렉토리인 경우 (문자열): 'c', 'k' 등
      else if (typeof child === 'string') {
        const mode = FILE_MODE.DIR; // 디렉토리용 파일 모드
        const header = `${mode} ${child}\0`;
        const headerBuffer = Buffer.from(header, 'utf-8');

        // 디렉토리 해시 값은 아직 모름 → 저장된 treeHashMap에서 가져와야 함
        const fullPath = path.posix.join(dirPath, child); // 예: 'a/b/c'
        const treeHash = this.treeHashMap.get(fullPath); // 사전 계산된 tree 해시
        const hashBuffer = Buffer.from(treeHash, 'hex');

        chunks.push(Buffer.concat([headerBuffer, hashBuffer]));
      }
    }

    return Buffer.concat(chunks);
  }

  /** Tree 객체 압축 */
  compressTree() { }

  /** Tree 객체 저장 */
  saveTree() { }


}