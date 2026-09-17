// Prosty komponent podpisu odręcznego na canvasie - dziala z myszka i dotykiem (tablet/telefon)
function initSignaturePad(canvasId, hiddenInputId, clearBtnId) {
  const canvas = document.getElementById(canvasId);
  const hiddenInput = document.getElementById(hiddenInputId);
  const clearBtn = document.getElementById(clearBtnId);
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1b2430';
  }
  resizeCanvas();

  let drawing = false;
  let hasDrawn = false;
  let last = { x: 0, y: 0 };

  function getPos(evt) {
    const rect = canvas.getBoundingClientRect();
    if (evt.touches && evt.touches.length > 0) {
      return { x: evt.touches[0].clientX - rect.left, y: evt.touches[0].clientY - rect.top };
    }
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }

  function start(evt) {
    evt.preventDefault();
    drawing = true;
    hasDrawn = true;
    last = getPos(evt);
  }
  function move(evt) {
    if (!drawing) return;
    evt.preventDefault();
    const pos = getPos(evt);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    last = pos;
    hiddenInput.value = canvas.toDataURL('image/png');
  }
  function end() { drawing = false; }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);

  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);

  if (clearBtn) {
    clearBtn.addEventListener('click', function (e) {
      e.preventDefault();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hiddenInput.value = '';
      hasDrawn = false;
    });
  }

  window.addEventListener('resize', function () {
    const dataUrl = hasDrawn ? canvas.toDataURL('image/png') : null;
    resizeCanvas();
    if (dataUrl) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
      img.src = dataUrl;
    }
  });
}
