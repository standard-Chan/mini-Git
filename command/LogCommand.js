import path from 'path';
import zlib from 'zlib';
import fs from 'fs';
import chalk from 'chalk';
import GitUtil from '../GitUtil.js';

export default class LogCommand {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPath = path.join(rootPath, '.git');

    this.objectsPath = path.join(this.gitPath, 'objects');
    this.headPath = path.join(this.gitPath, 'HEAD');
    this.refsHeadsPath = path.join(this.gitPath, 'refs', 'heads');
    this.indexPath = path.join(this.gitPath, 'index');

    this.gitUtil = GitUtil.getInstance();
  }

  log() {
    let currentHash = this.gitUtil.getCurrentCommitHash();

    while (currentHash) {
      const dir = path.join(this.objectsPath, currentHash.slice(0, 2));
      const file = path.join(dir, currentHash);

      if (!fs.existsSync(file)) {
        console.error(
          chalk.red(`[ERROR] 커밋 객체 ${chalk.yellow(currentHash)}를 찾을 수 없습니다.`)
        );
        break;
      }

      const compressed = fs.readFileSync(file);
      const decompressed = zlib.inflateSync(compressed).toString();

      const headerEnd = decompressed.indexOf('\0');
      const content = decompressed.slice(headerEnd + 1);

      const lines = content.split('\n');
      const parentLine = lines.find(l => l.startsWith('parent '));
      const authorLine = lines.find(l => l.startsWith('author '));
      const msgIndex = lines.findIndex(line => line.trim() === '');
      const messageLines = lines.slice(msgIndex + 1);

      const authorMatch = authorLine
        .replace(/^author /, '')
        .match(/^(.+?) <(.+?)> (\d+) ([+-]\d{4})$/);

      const [, authorName, email, timestamp, timezone] = authorMatch;
      const dateStr = new Date(Number(timestamp) * 1000).toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
      });

      // 출력
      console.log(`${chalk.yellow('commit')} ${chalk.yellow(currentHash)}`);
      console.log(
        `${chalk.bold('작성자')}: ${chalk.cyanBright(authorName)} <${chalk.cyan(email)}>`
      );
      console.log(`${chalk.bold('날짜')}:   ${chalk.gray(dateStr)} ${chalk.gray(timezone)}`);
      console.log(`\n    ${chalk.green(messageLines.join('\n    '))}\n`);

      if (parentLine) {
        currentHash = parentLine.split(' ')[1];
      } else {
        break;
      }
    }
  }
}
