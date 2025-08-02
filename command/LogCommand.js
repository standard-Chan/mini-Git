import path from 'path';
import zlib from 'zlib';
import fs from 'fs';
import GitUtil from '../GitUtil.js';

export default class LogCommand {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPath = path.join(rootPath, ".git");

    this.objectsPath = path.join(this.gitPath, "objects");
    this.headPath = path.join(this.gitPath, "HEAD");
    this.refsHeadsPath = path.join(this.gitPath, "refs", "heads");
    this.indexPath = path.join(this.gitPath, "index");

    this.gitUtil = GitUtil.getInstance();
  }


  log() {
    // 현재 commit HASH 얻기
    let currentHash = this.gitUtil.getCurrentCommitHash();

    while (currentHash) {
      // 해당 commit hash 객체 읽기
      const dir = path.join(this.objectsPath, currentHash.slice(0, 2));
      const file = path.join(dir, currentHash);

      if (!fs.existsSync(file)) {
        console.error(`[ERROR] 커밋 객체 ${currentHash}를 찾을 수 없습니다.`);
        break;
      }

      // 압축 해제하고 내용 읽기
      const compressed = fs.readFileSync(file);
      const decompressed = zlib.inflateSync(compressed).toString();


      // 헤더 제거 (예: "commit 180\0")
      const headerEnd = decompressed.indexOf('\0');
      const content = decompressed.slice(headerEnd + 1);

      // 파싱
      const lines = content.split('\n');
      const treeLine = lines.find(l => l.startsWith('tree '));
      const parentLine = lines.find(l => l.startsWith('parent '));
      const authorLine = lines.find(l => l.startsWith('author '));
      const committerLine = lines.find(l => l.startsWith('committer '));
      const msgIndex = lines.findIndex(line => line.trim() === '');
      const messageLines = lines.slice(msgIndex + 1);

      // 6. 날짜 포맷
      const authorMatch = authorLine
        .replace(/^author /, '')
        .match(/^(.+?) <(.+?)> (\d+) ([+-]\d{4})$/);


      const [, authorName, email, timestamp, timezone] = authorMatch;

      const dateStr = new Date(Number(timestamp) * 1000).toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
      });

      // 출력
      console.log(`커밋 hash : ${currentHash}`);
      console.log(`작 성 자  : ${authorName} <${email}>`);
      console.log(`날    짜  : ${dateStr} ${timezone}`);
      console.log(`커밋 메시지\n    ${messageLines.join('\n    ')}\n`);

      // 다음 커밋 (parent)
      if (parentLine) {
        currentHash = parentLine.split(' ')[1];
      } else { // 첫 커밋인 경우
        break;
      }
    }
  }

}