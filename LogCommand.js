import path from 'path';
import zlib from 'zlib';
import fs from 'fs';
import GitUtil from './GitUtil.js';

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
    // 1. HEAD → 현재 커밋 해시 얻기
    let headRef = this.gitUtil.readFile(this.headPath, 'utf-8').trim();
    if (!headRef.startsWith('ref:')) {
      console.error('❌ HEAD가 브랜치를 가리키고 있지 않습니다.');
      return;
    }

    const refPath = path.join(this.gitPath, headRef.slice(5));
    if (!fs.existsSync(refPath)) {
      console.error('❌ 현재 브랜치에 커밋이 없습니다.');
      return;
    }

    let currentHash = this.gitUtil.readFile(refPath, 'utf-8').trim();

    while (currentHash) {
      // 2. 객체 디렉토리 경로
      const dir = path.join(this.objectsPath, currentHash.slice(0, 2));
      const file = path.join(dir, currentHash);

      if (!fs.existsSync(file)) {
        console.error(`❌ 커밋 객체 ${currentHash}를 찾을 수 없습니다.`);
        break;
      }

      // 3. 압축 해제 + 내용 읽기
      const compressed = fs.readFileSync(file);
      const decompressed = zlib.inflateSync(compressed).toString();

      // 4. 헤더 제거 (예: "commit 180\0")
      const headerEnd = decompressed.indexOf('\0');
      const content = decompressed.slice(headerEnd + 1);

      // 5. 파싱
      const lines = content.split('\n');
      const treeLine = lines.find(l => l.startsWith('tree '));
      const parentLine = lines.find(l => l.startsWith('parent '));
      const authorLine = lines.find(l => l.startsWith('author '));
      const committerLine = lines.find(l => l.startsWith('committer '));
      const msgIndex = lines.findIndex(line => line.trim() === '');
      const messageLines = lines.slice(msgIndex + 1);

      // 6. 날짜 포맷
      if (!authorLine) {
        console.log(`commit ${currentHash}`);
        console.log(`Author: Unknown`);
        console.log(`Date:   Unknown`);
        console.log(`\n    ${messageLines.join('\n    ')}\n`);
      } else {
        const authorMatch = authorLine
          .replace(/^author /, '')
          .match(/^(.+?) <(.+?)> (\d+) ([+-]\d{4})$/);
        
        if (!authorMatch) {
          console.log(`commit ${currentHash}`);
          console.log(`Author: ${authorLine.replace(/^author /, '')}`);
          console.log(`Date:   Unknown`);
          console.log(`\n    ${messageLines.join('\n    ')}\n`);
        } else {
          const [, authorName, email, timestamp, timezone] = authorMatch;
          
          const dateStr = new Date(Number(timestamp) * 1000).toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
          });

          // 7. 출력
          console.log(`commit ${currentHash}`);
          console.log(`Author: ${authorName} <${email}>`);
          console.log(`Date:   ${dateStr} ${timezone}`);
          console.log(`\n    ${messageLines.join('\n    ')}\n`);
        }
      }

      // 8. 다음 커밋 (parent)
      if (parentLine) {
        currentHash = parentLine.split(' ')[1];
      } else {
        break; // 최초 커밋이면 parent 없음
      }
    }
  }

}