import { CAMPAIGN_TITLE_TELUGU } from '../firebase';

const PORTRAIT_IMAGE_SRC = '/assets/aistudio/IMG_6823_c5503f94.PNG';
const PORTRAIT_BG_SRC = '/assets/aistudio/IMG_6825.JPG_cff378fb.jpeg';

export type ShareCardOutcome = 'shared' | 'downloaded' | 'cancelled' | 'error';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawHeartIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  const s = size / 24;
  ctx.scale(s, s);
  ctx.translate(-12, -12);
  ctx.beginPath();
  ctx.moveTo(12, 21.35);
  ctx.bezierCurveTo(10.55, 20.03, 5.4, 15.36, 2.8, 12.28);
  ctx.bezierCurveTo(0.8, 9.9, 1.1, 6.2, 3.6, 4.3);
  ctx.bezierCurveTo(5.8, 2.6, 8.9, 3.1, 10.6, 5.2);
  ctx.lineTo(12, 6.9);
  ctx.lineTo(13.4, 5.2);
  ctx.bezierCurveTo(15.1, 3.1, 18.2, 2.6, 20.4, 4.3);
  ctx.bezierCurveTo(22.9, 6.2, 23.2, 9.9, 21.2, 12.28);
  ctx.bezierCurveTo(18.6, 15.36, 13.45, 20.03, 12, 21.35);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

interface PixelCenteredTextOptions {
  canvasWidth: number;
  y: number;
  maxWidth: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
}

/**
 * Renders complex scripts (like Telugu) centered using actual rasterized ink bounds
 * so iOS Safari / WebKit Canvas `textAlign = 'center'` bugs cannot shift the text off-center.
 */
function drawPixelCenteredText(
  targetCtx: CanvasRenderingContext2D,
  text: string,
  options: PixelCenteredTextOptions
) {
  const { canvasWidth, y, maxWidth, fontSize, fontFamily, fontWeight, color } =
    options;
  const fontSpec = `${fontWeight} ${fontSize}px ${fontFamily}`;

  const scratch = document.createElement('canvas');
  const scratchW = canvasWidth + 400;
  const scratchH = Math.ceil(fontSize * 2.4);
  scratch.width = scratchW;
  scratch.height = scratchH;

  const sctx = scratch.getContext('2d', { willReadFrequently: true });
  if (!sctx) {
    targetCtx.save();
    targetCtx.font = fontSpec;
    targetCtx.fillStyle = color;
    targetCtx.textAlign = 'left';
    targetCtx.textBaseline = 'top';
    const w = targetCtx.measureText(text).width;
    targetCtx.fillText(text, Math.round((canvasWidth - w) / 2), y);
    targetCtx.restore();
    return;
  }

  sctx.font = fontSpec;
  sctx.fillStyle = color;
  sctx.textAlign = 'left';
  sctx.textBaseline = 'top';
  const padX = 120;
  const padY = Math.round(fontSize * 0.45);
  sctx.fillText(text, padX, padY);

  const imageData = sctx.getImageData(0, 0, scratchW, scratchH).data;
  let minX = scratchW;
  let maxX = -1;
  let minY = scratchH;
  let maxY = -1;

  for (let row = 0; row < scratchH; row++) {
    const rowOffset = row * scratchW * 4;
    for (let col = 0; col < scratchW; col++) {
      if (imageData[rowOffset + col * 4 + 3] > 8) {
        if (col < minX) minX = col;
        if (col > maxX) maxX = col;
        if (row < minY) minY = row;
        if (row > maxY) maxY = row;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    targetCtx.save();
    targetCtx.font = fontSpec;
    targetCtx.fillStyle = color;
    targetCtx.textAlign = 'left';
    targetCtx.textBaseline = 'top';
    const w = targetCtx.measureText(text).width;
    targetCtx.fillText(text, Math.round((canvasWidth - w) / 2), y);
    targetCtx.restore();
    return;
  }

  const inkW = maxX - minX + 1;
  const inkH = maxY - minY + 1;
  const scale = inkW > maxWidth ? maxWidth / inkW : 1;
  const destW = Math.round(inkW * scale);
  const destH = Math.round(inkH * scale);
  const destX = Math.round((canvasWidth - destW) / 2);

  targetCtx.drawImage(
    scratch,
    minX,
    minY,
    inkW,
    inkH,
    destX,
    y,
    destW,
    destH
  );
}

export async function generateSupportCardBlob(
  communityCount: number
): Promise<Blob> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Proceed even if font readiness check fails
    }
  }

  // Mobile-friendly 4:5 vertical portrait card (ideal for WhatsApp, Status, Instagram)
  const width = 1080;
  const height = 1350;
  const heroHeight = 720;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Clean Apple light canvas
  ctx.fillStyle = '#FBFBFD';
  ctx.fillRect(0, 0, width, height);

  // Load local background & portrait cutout in parallel
  const [bgImg, portraitImg] = await Promise.all([
    loadImage(PORTRAIT_BG_SRC),
    loadImage(PORTRAIT_IMAGE_SRC),
  ]);

  // 1. Top 100%-width softly blurred backdrop + Persons cutout portrait
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, heroHeight);
  ctx.clip();

  if (bgImg) {
    const scale =
      Math.max(width / bgImg.naturalWidth, heroHeight / bgImg.naturalHeight) *
      1.12;
    const drawW = bgImg.naturalWidth * scale;
    const drawH = bgImg.naturalHeight * scale;
    const drawX = (width - drawW) / 2;
    const drawY = (heroHeight - drawH) / 2;

    ctx.filter = 'blur(22px)';
    ctx.globalAlpha = 0.95;
    ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
  } else {
    const fallbackGrad = ctx.createLinearGradient(0, 0, width, heroHeight);
    fallbackGrad.addColorStop(0, '#EEF2FF');
    fallbackGrad.addColorStop(1, '#FCE7F3');
    ctx.fillStyle = fallbackGrad;
    ctx.fillRect(0, 0, width, heroHeight);
  }

  if (portraitImg) {
    const maxPortraitW = 920;
    const maxPortraitH = 650;
    const ratio = Math.min(
      maxPortraitW / portraitImg.naturalWidth,
      maxPortraitH / portraitImg.naturalHeight
    );
    const drawW = portraitImg.naturalWidth * ratio;
    const drawH = portraitImg.naturalHeight * ratio;
    const drawX = (width - drawW) / 2;
    const drawY = heroHeight - drawH;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 10;
    ctx.drawImage(portraitImg, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  // Smooth white gradient fade over portrait cutout bottom edge
  const bottomFade = ctx.createLinearGradient(0, heroHeight - 140, 0, heroHeight);
  bottomFade.addColorStop(0, 'rgba(251, 251, 253, 0)');
  bottomFade.addColorStop(0.55, 'rgba(251, 251, 253, 0.65)');
  bottomFade.addColorStop(1, 'rgba(251, 251, 253, 1)');
  ctx.fillStyle = bottomFade;
  ctx.fillRect(0, heroHeight - 140, width, 140);

  ctx.restore();

  // 2. Person Name in bold Anek Telugu (pixel-centered to prevent iOS Safari Indic Canvas textAlign bug)
  drawPixelCenteredText(ctx, CAMPAIGN_TITLE_TELUGU, {
    canvasWidth: width,
    y: heroHeight + 42,
    maxWidth: width - 120,
    fontSize: 64,
    fontFamily: '"Anek Telugu", "Plus Jakarta Sans", sans-serif',
    fontWeight: '700',
    color: '#1D1D1F',
  });

  // 3. Community Members Number + Emerald Live Dot Label
  ctx.fillStyle = '#1D1D1F';
  ctx.font = '600 118px "Plus Jakarta Sans", -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    communityCount.toLocaleString('en-IN'),
    width / 2,
    heroHeight + 168
  );

  const membersLabel = 'Community members';
  ctx.font = '500 32px "DM Sans", -apple-system, sans-serif';
  const labelWidth = ctx.measureText(membersLabel).width;
  const dotRadius = 8;
  const dotGap = 16;
  const groupW = dotRadius * 2 + dotGap + labelWidth;
  const groupStartX = (width - groupW) / 2;
  const membersY = heroHeight + 308;

  // Soft outer emerald pulse glow
  ctx.beginPath();
  ctx.arc(groupStartX + dotRadius, membersY + 17, dotRadius + 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.24)';
  ctx.fill();

  // Solid emerald dot
  ctx.beginPath();
  ctx.arc(groupStartX + dotRadius, membersY + 17, dotRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#10B981';
  ctx.fill();

  ctx.fillStyle = '#6E6E73';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(membersLabel, groupStartX + dotRadius * 2 + dotGap, membersY);

  // 4. Classic Apple Blue "Join Community" Button Graphic
  const btnW = 560;
  const btnH = 104;
  const btnX = (width - btnW) / 2;
  const btnY = heroHeight + 412;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 113, 227, 0.34)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 12;
  drawRoundedRect(ctx, btnX, btnY, btnW, btnH, btnH / 2);
  ctx.fillStyle = '#0071E3';
  ctx.fill();
  ctx.restore();

  // Subtle top glossy highlight inside button
  ctx.save();
  drawRoundedRect(ctx, btnX, btnY, btnW, btnH, btnH / 2);
  ctx.clip();
  const btnHighlight = ctx.createLinearGradient(0, btnY, 0, btnY + btnH / 2);
  btnHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
  btnHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = btnHighlight;
  ctx.fillRect(btnX, btnY, btnW, btnH / 2);
  ctx.restore();

  // Heart icon + "Join Community" label centered inside button
  const btnLabel = 'Join Community';
  ctx.font = '600 36px "Plus Jakarta Sans", -apple-system, sans-serif';
  const btnTextWidth = ctx.measureText(btnLabel).width;
  const iconSize = 32;
  const iconGap = 16;
  const totalContentW = iconSize + iconGap + btnTextWidth;
  const contentStartX = (width - totalContentW) / 2;
  const btnCenterY = btnY + btnH / 2;

  drawHeartIcon(ctx, contentStartX + iconSize / 2, btnCenterY, iconSize, '#FFFFFF');

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(btnLabel, contentStartX + iconSize + iconGap, btnCenterY + 1);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to encode share card image'));
        }
      },
      'image/png',
      1
    );
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function shareSupportCard(
  communityCount: number
): Promise<ShareCardOutcome> {
  const filename = 'our-tatiparthi-community-card.png';
  const shareUrl = window.location.href;
  const shareTitle = `Social Proof — ${CAMPAIGN_TITLE_TELUGU}`;
  const shareText = `${CAMPAIGN_TITLE_TELUGU} — Join Community (${communityCount.toLocaleString('en-IN')} Community members): ${shareUrl}`;

  try {
    const blob = await generateSupportCardBlob(communityCount);
    const file = new File([blob], filename, { type: 'image/png' });

    // Try native device Share Sheet with generated image card (Android / iOS)
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      const canShareFile =
        typeof navigator.canShare === 'function'
          ? navigator.canShare({ files: [file] })
          : false;

      if (canShareFile) {
        try {
          await navigator.share({
            files: [file],
            title: shareTitle,
            text: shareText,
            url: shareUrl,
          });
          return 'shared';
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            return 'cancelled';
          }
          // Some mobile OS share sheets reject files + url together; retry with files + text
          try {
            await navigator.share({
              files: [file],
              title: shareTitle,
              text: shareText,
            });
            return 'shared';
          } catch (retryErr) {
            if (retryErr instanceof Error && retryErr.name === 'AbortError') {
              return 'cancelled';
            }
          }
        }
      }
    }

    // Fallback (desktop or restricted iframe): download PNG card + copy share link
    triggerDownload(blob, filename);
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        // Ignore clipboard errors in non-focused frames
      }
    }
    return 'downloaded';
  } catch (error) {
    console.error('Failed to generate or share support card:', error);
    return 'error';
  }
}
