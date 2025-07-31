import path from 'path';
import fs from 'fs';
import GitUtil from './GitUtil.js';
import GitPaths from './GitPaths.js';
import { FILE_MODE } from './constants.js';

export default class CommitCommand {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPaths = GitPaths.of(rootPath);
    this.gitUtil = GitUtil.getInstance();
  }

  /** Tree 객체 생성 후 root Hash 반환 */
  createTree() {
    const indexEntries = this.readIndex();
    const tree = this.convertEntriesToTree(indexEntries);
    const rootHash = this.buildTree(tree);
    this.clearIndex(); // 인덱스 파일 비우기
    return rootHash;
  }

  /** commit 객체 생성 */
  createCommit(message = "empty", author = "empty", email = "temp@gmail.com", rootHash) {
    // 현재 커밋 객체 해시
    const curCommitHash = this.gitUtil.getCurrentCommitHash();

    const content = this.createCommitContent(message, author, email, rootHash, curCommitHash);

    const commitHash = this.gitUtil.getSha1Hash(content);
    const compressed = this.gitUtil.compress(content);
    this.gitUtil.saveObject(commitHash, compressed); // 저장

    console.log(`커밋 완료 - ${commitHash}`);
    return commitHash;
  }

  /** Head 커밋 객체 정보 업데이트 */
  updateHead(commitHash) {
    const headRef = this.gitUtil.readFile(this.gitPaths.headPath, 'utf-8').trim();

    if (headRef.startsWith("ref:")) {
      const refPath = path.join(this.gitPaths.gitPath, headRef.slice(5));
      fs.writeFileSync(refPath, commitHash);
    }
  }

  /** commit 내용 생성 */
  createCommitContent(commitMessage, author, email, rootHash, curCommitHash) {
    const timestamp = Math.floor(Date.now() / 1000);
    const timezone = '+0900';

    const content = [
      `tree ${rootHash}`,
      curCommitHash ? `parent ${curCommitHash}` : '',
      `author ${author} <${email}> ${timestamp} ${timezone}`,
      `committer ${author} <${email}> ${timestamp} ${timezone}`,
      '',
      commitMessage
    ].filter(Boolean).join('\n');

    return `commit ${content.length}\0${content}`;
  }

  /** index 파일을 읽고 파싱한다. [{fileMode, hash, filePath}, ... ]*/
  readIndex() {
    let indexEntries = []; // [{ fileMode, hash, filePath }, ...]
    const indexLines = this.gitUtil.readFile(this.gitPaths.indexPath, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean);

    indexLines.forEach(line => {
      const [fileMode, hash, filePath] = line.trim().split(' ');
      indexEntries.push({ fileMode, hash, filePath });
    });

    return indexEntries;
  }

  /** Entries를 Tree 자료구조로 변환 */
  convertEntriesToTree(entries) {
    let tree = {};
    entries.forEach(({ fileMode, hash, filePath }) => {
      tree = this.insertIntoTree(tree, filePath, fileMode, hash);
    })

    return { root: tree };
  }

  /** 트리구조 자료구조에 path에 맞게 데이터를 넣는다.
   * ex: a/b/text.txt 를 {a:{b:{'text.txt': {fileMode, filename, hash}}}}  
   * @param {String} path 예시 : 'a/b/text.txt'
   * */
  insertIntoTree(tree, filePath, fileMode, hash) {
    let current = tree;

    // filePath를 분할 'a/b/text.txt' => ['a', 'b', 'text.txt']
    const paths = filePath.split('/');

    for (let i = 0; i < paths.length; i++) {
      const pathName = paths[i];

      if (i === paths.length - 1) {
        current[pathName] = { fileMode, filename: pathName, hash }; // 파일 삽입
      } else {
        if (!current[pathName]) current[pathName] = {};  // 디렉토리 삽입
        current = current[pathName];
      }
    }

    return tree;
  }

  /** Tree 자료구조를 leaf 노드에서부터 올라오면서 Tree 의 content를 채운다.
   * @param {*} cur 현재 노드
  */
  buildTree(cur) {
    (!cur.content) ? cur.content = '' : cur.content += ('\n'); // 없으면 만들고 있으면 한줄 띄우기

    // 자식 순회
    for (const child in cur) {
      if (child == 'content') continue;

      const childNode = cur[child];
      if (childNode.fileMode && childNode.hash) { // 파일인 경우
        cur.content += (`${FILE_MODE.REGULAR} ${childNode.filename}\0${childNode.hash}`);
      }
      else { // 디렉토리인 경우
        const hash = this.buildTree(childNode); // 하위 노드 먼저 방문하여 content 채우기
        cur['content'] += (`${FILE_MODE.DIR} ${child}\0${hash}`);
      }
    }

    const hash = this.createTreeObject(cur.content);

    return hash;
  }

  /** Tree 객체를 생성하고 저장한다. 이후 hash 값을 반환한다.*/
  createTreeObject(content) {
    const hash = this.gitUtil.getSha1Hash(content);
    const compressed = this.gitUtil.compress(content);
    this.gitUtil.saveObject(hash, compressed);
    //console.log(`- '${filename}'directory가 갱신되었습니다.`);
    return hash;
  }

  clearIndex() {
    fs.writeFileSync(this.gitPaths.indexPath, '');
    console.log("커밋이 성공하여, 스테이징된 파일들을 지웁니다.");
  }
}
