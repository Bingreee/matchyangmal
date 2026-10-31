import * as Phaser from 'phaser';
import { GAME_CONFIG } from './config';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: GAME_CONFIG.theme.background,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  scale: {
    // 세로 720x1280 기준 화면을 폰 비율에 맞춰 잘림 없이 맞추고 가운데 정렬
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 2 },
  scene: [TitleScene, GameScene, ResultScene],
});

// 개발 중 브라우저 콘솔에서 확인용 (배포 빌드에는 들어가지 않음)
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
