import path from 'path';
import zlib from 'zlib';
import fs from 'fs';
import chalk from 'chalk';
import GitUtil from '../GitUtil.js';
import GitPaths from '../GitPaths.js';

export default class LogCommand {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPaths = GitPaths.of(rootPath);
    this.gitUtil = GitUtil.getInstance();
  }

  log() {
    let currentHash = this.gitUtil.getCurrentCommitHash();

    if (!currentHash) {
      console.log(chalk.yellow('현재 commit이 없습니다.\n'));
      return;
    }

    while (currentHash) {
      const dir = path.join(this.gitPaths.objectsPath, currentHash.slice(0, 2));
      const file = path.join(dir, currentHash.slice(2));

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

      // authorLine이 없는 경우 안전 처리
      if (!authorLine) {
        console.error(chalk.red(`[ERROR] 커밋 객체에서 author 정보를 찾을 수 없습니다.`));
        break;
      }

      const authorMatch = authorLine
        .replace(/^author /, '')
        .match(/^(.+?) <(.+?)> (\d+) ([+-]\d{4})$/);

      if (!authorMatch) {
        console.error(chalk.red(`[ERROR] author 정보 파싱에 실패했습니다: ${authorLine}`));
        break;
      }

      const [, authorName, email, timestamp, timezone] = authorMatch;
      const dateStr = new Date(Number(timestamp) * 1000).toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
      });

      // Git 스타일 출력
      console.log(`${chalk.yellow('commit')} ${chalk.yellow(currentHash)}`);
      console.log(
        `${chalk.bold('작성자')}: ${chalk.cyan(authorName)} <${chalk.cyan(email)}>`
      );
      console.log(`${chalk.bold('날짜')}:   ${chalk.gray(dateStr)} ${chalk.gray(timezone)}\n`);
      console.log(`    ${chalk.white(messageLines.join('\n    '))}`);
      console.log('');

      if (parentLine) {
        currentHash = parentLine.split(' ')[1];
      } else {
        break;
      }
    }
  }
}