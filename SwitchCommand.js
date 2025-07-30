import path from 'path';
import fs from 'fs';

export default class SwitchCommand {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPath = path.join(rootPath, ".git");
    this.headPath = path.join(this.gitPath, "HEAD");
    this.refsHeadsPath = path.join(this.gitPath, "refs", "heads");
  }

  moveHeadTo(branchName) {
    const branchPath = path.join(this.refsHeadsPath, branchName);
    
    // 브랜치가 존재하는지 확인
    if (!fs.existsSync(branchPath)) {
      throw new Error(`브랜치 '${branchName}'가 존재하지 않습니다.`);
    }

    // HEAD 파일 내용 변경
    const newHeadContent = `ref: refs/heads/${branchName}\n`;
    fs.writeFileSync(this.headPath, newHeadContent);

    console.log(`switch : HEAD가 '${branchName}' 브랜치를 가리키도록 변경되었습니다.`);
  }
}