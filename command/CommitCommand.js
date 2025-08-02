import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import GitUtil from '../GitUtil.js';
import GitPaths from '../GitPaths.js';
import { FILE_MODE } from '../constants.js';

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
    const curCommitHash = this.gitUtil.getCurrentCommitHash();
    const content = this.createCommitContent(message, author, email, rootHash, curCommitHash);

    const commitHash = this.gitUtil.getSha1Hash(content);
    const compressed = this.gitUtil.compress(content);
    this.gitUtil.saveObject(commitHash, compressed);

    console.log(chalk.green('커밋 완료'), '-', chalk.yellow(commitHash));
    return commitHash;
  }

  /** Head 커밋 객체 정보 업데이트 */
  updateHead(commitHash) {
    const headRef = this.gitUtil.readFile(this.gitPaths.headPath, 'utf-8').trim();

    if (headRef.startsWith("ref:")) {
      const refPath = path.join(this.gitPaths.gitPath, headRef.slice(5));
      fs.writeFileSync(refPath, commitHash);
      console.log(`[${chalk.gray('HEAD')}] ${chalk.cyanBright(headRef.slice(5))} -> ${commitHash}`);
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

  /** index 파일을 읽고 파싱한다. */
  readIndex() {
    const lines = this.gitUtil.readFile(this.gitPaths.indexPath, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean);

    return lines.map(line => {
      const [fileMode, hash, filePath] = line.trim().split(' ');
      return { fileMode, hash, filePath };
    });
  }

  /** Entries를 Tree 자료구조로 변환 */
  convertEntriesToTree(entries) {
    let tree = {};
    entries.forEach(({ fileMode, hash, filePath }) => {
      tree = this.insertIntoTree(tree, filePath, fileMode, hash);
    });

    return { root: tree };
  }

  /** 트리구조 자료구조에 path에 맞게 데이터를 넣는다. */
  insertIntoTree(tree, filePath, fileMode, hash) {
    let current = tree;
    const paths = filePath.split('/');

    for (let i = 0; i < paths.length; i++) {
      const pathName = paths[i];
      if (i === paths.length - 1) {
        current[pathName] = { fileMode, filename: pathName, hash };
      } else {
        if (!current[pathName]) current[pathName] = {};
        current = current[pathName];
      }
    }

    return tree;
  }

  /** Tree 자료구조를 leaf부터 올라오며 content 구성 */
  buildTree(cur) {
    (!cur.content) ? cur.content = '' : cur.content += '\n';

    for (const child in cur) {
      if (child === 'content') continue;

      const childNode = cur[child];
      if (childNode.fileMode && childNode.hash) {
        cur.content += `${FILE_MODE.REGULAR} ${childNode.filename}\0${childNode.hash}`;
        console.log(chalk.gray(`- ${chalk.cyanBright(childNode.filename)} 파일 추가됨 (hash: ${chalk.yellow(childNode.hash)})`));
      } else {
        const hash = this.buildTree(childNode);
        cur.content += `${FILE_MODE.DIR} ${child}\0${hash}`;
        console.log(chalk.blue(`'${chalk.cyanBright(child)}' -> ${chalk.yellow(hash)}`));
      }
    }

    return this.createTreeObject(cur.content);
  }

  /** Tree 객체 생성 및 저장 */
  createTreeObject(content) {
    const hash = this.gitUtil.getSha1Hash(content);
    const compressed = this.gitUtil.compress(content);
    this.gitUtil.saveObject(hash, compressed);
    return hash;
  }

  /** 인덱스 초기화 */
  clearIndex() {
    fs.writeFileSync(this.gitPaths.indexPath, '');
    console.log(chalk.gray('스테이징된 파일들(index)을 초기화했습니다.'));
  }
}
