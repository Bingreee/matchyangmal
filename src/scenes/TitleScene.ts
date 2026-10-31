import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { createDesigns } from '../logic/sockDesign';
import { saveStore } from '../storage/SaveStore';
import { unlockAudio } from '../audio/sfx';
import { ensureSockAtlas, SOCK_ATLAS_KEY, sockFrame } from '../view/sockTexture';
import { createButton, drawBackground, textStyle } from '../view/ui';
import { SceneKeys } from './keys';

const T = GAME_CONFIG.theme;

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    const { width, height } = GAME_CONFIG;
    drawBackground(this);

    // 장식용 양말 두 짝
    ensureSockAtlas(this);
    const [d1, d2] = createDesigns(2);
    const s1 = this.add.image(width / 2 - 110, 560, SOCK_ATLAS_KEY, sockFrame(d1)).setScale(1.5).setAngle(-18);
    const s2 = this.add.image(width / 2 + 110, 560, SOCK_ATLAS_KEY, sockFrame(d2)).setScale(1.5).setAngle(14).setFlipX(true);
    [s1, s2].forEach((s, i) =>
      this.tweens.add({ targets: s, y: s.y - 18, angle: s.angle + (i ? -6 : 6), duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 300 }),
    );

    this.add.text(width / 2, 260, '짝양말', textStyle(120, T.accent)).setOrigin(0.5).setStroke('#ffffff', 14);
    this.add.text(width / 2, 370, '건조기에서 쏟아진 양말,\n짝을 찾아 주세요!', textStyle(36, T.text, false)).setOrigin(0.5).setLineSpacing(10);

    const best = saveStore.load().bestScore;
    this.add.text(width / 2, 800, `최고 점수  ${best.toLocaleString()}`, textStyle(34)).setOrigin(0.5);

    createButton(this, width / 2, 940, '시작하기', () => {
      unlockAudio();
      this.scene.start(SceneKeys.Game);
    });

    this.add
      .text(width / 2, height - 90, `같은 양말 두 개를 차례로 탭!  제한 시간 ${GAME_CONFIG.timeLimitSec}초`, textStyle(26, T.text, false))
      .setOrigin(0.5)
      .setAlpha(0.7);
  }
}
