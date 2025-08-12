// effect.js
// blood 잔상 생성 함수
export function createBloodEffect(playfield, x, y) {
  const effect = document.createElement('div');
  effect.className = 'blood-splash';
  effect.style.left = `${x - 40}px`; // 중앙 맞춤 (80px / 2)
  effect.style.top = `${y - 40}px`;
  playfield.appendChild(effect);

  setTimeout(() => {
    effect.remove();
  }, 2000); // 2초 뒤 제거
}
