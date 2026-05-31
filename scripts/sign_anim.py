#!/usr/bin/env python3
"""署名の手書き風リビールアニメ (参考動画スタイル).

参考: nagi-yoshida.com の opening 動画
 - 細い均一なペン線(中心線抽出)
 - 横方向グラデ配色 (シアン -> 青 -> 紫 -> マゼンタ -> ピンク -> オレンジ -> 金)
 - 光点なし、黒背景、中央配置で余白広め
 - 真っ黒 -> 左から右へ滑らかに線が伸びる -> 完成して静止保持
"""
import os
import numpy as np
from PIL import Image
from skimage.morphology import skeletonize
from scipy import ndimage

# ---- パス解決 ----
# このスクリプトは scripts/ 配下にある前提で、リポジトリルートを導出する。
HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(HERE)

# 入力サイン画像：環境変数 SIGN_SRC で上書き可。
# デフォルトは ~/Downloads/サイン.png（ユーザの一般的な配置を想定）。
SRC = os.environ.get(
    "SIGN_SRC",
    os.path.expanduser("~/Downloads/サイン.png"),
)
# 中間フレームの出力先：環境変数 SIGN_FRAMES で上書き可。
FRAME_DIR = os.environ.get("SIGN_FRAMES", "/tmp/sign_frames")

FPS = 30
LEAD_BLACK_S = 0.2
WRITE_S = 4.0
HOLD_S = 0.9

# ヒーロー常設用の透過PNG出力先（リポジトリ内 assets/images/signature.png）
PNG_OUT = os.path.join(REPO_ROOT, "assets", "images", "signature.png")

DISP_W = 1500            # 署名の表示幅(px)
CANVAS_W = 2400         # 画面サイズ(余白込み)
CANVAS_H = 1480
LINE_HALF = 1.4         # 線の半幅(px) 細いペン線
LINE_AA = 1.4           # アンチエイリアス幅(px)
EDGE_FRAC = 0.012       # 先端フェザー(インク総量比)

# 横位置に対する配色ストップ (0=左 .. 1=右)
# 白黒モノトーン: 寒色寄りのシルバー <-> 白 で、銀塩写真風の上品な質感
STOPS = [
    (0.00, (188, 192, 200)),  # 冷たいシルバーグレー
    (0.28, (255, 255, 255)),  # 純白(ハイライト)
    (0.55, (224, 228, 234)),  # ごく薄いグレー
    (0.78, (255, 255, 255)),  # 再び白でツヤ
    (1.00, (196, 200, 208)),  # シルバーグレーで締め
]


def smoothstep(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3 - 2 * t)


def gradient_colors(fracs):
    """0..1 配列 -> RGB(0..255) 配列 (N,3) を STOPS 線形補間で返す."""
    pos = np.array([s[0] for s in STOPS])
    cols = np.array([s[1] for s in STOPS], dtype=np.float32)
    out = np.empty((len(fracs), 3), dtype=np.float32)
    for c in range(3):
        out[:, c] = np.interp(fracs, pos, cols[:, c])
    return out


def main():
    os.makedirs(FRAME_DIR, exist_ok=True)
    for f in os.listdir(FRAME_DIR):
        if f.endswith(".png"):
            os.remove(os.path.join(FRAME_DIR, f))

    # 1) 読み込み・二値化・中心線抽出
    gray = np.asarray(Image.open(SRC).convert("L"), dtype=np.float32) / 255.0
    binary = gray > 0.35
    skel = skeletonize(binary)

    # 2) 中心線を細い線として描画 (距離ベースのAA)
    dist = ndimage.distance_transform_edt(~skel)
    line_full = np.clip(1.0 - (dist - LINE_HALF) / LINE_AA, 0.0, 1.0).astype(np.float32)

    # ヒーロー常設用: 白の細線サインを背景透過PNGで保存
    os.makedirs(os.path.dirname(PNG_OUT), exist_ok=True)
    alpha = (line_full * 255).astype(np.uint8)
    Hf0, Wf0 = line_full.shape
    rgba = np.empty((Hf0, Wf0, 4), dtype=np.uint8)
    rgba[..., :3] = 255          # 白
    rgba[..., 3] = alpha
    Image.fromarray(rgba, "RGBA").save(PNG_OUT)
    print(f"saved transparent PNG: {PNG_OUT} ({Wf0}x{Hf0})")

    # 3) 表示サイズへ縮小
    Hf, Wf = line_full.shape
    disp_h = int(round(Hf * DISP_W / Wf))
    line_img = Image.fromarray((line_full * 255).astype(np.uint8)).resize(
        (DISP_W, disp_h), Image.LANCZOS)
    line = np.asarray(line_img, dtype=np.float32) / 255.0  # disp_h x DISP_W

    H, W = line.shape

    # 4) 横位置グラデの配色マップ (インク存在範囲で 0..1 にマップ)
    col_ink = line.sum(axis=0)
    xs = np.where(col_ink > col_ink.max() * 0.01)[0]
    xmin, xmax = int(xs.min()), int(xs.max())
    xf = np.clip((np.arange(W) - xmin) / max(1, (xmax - xmin)), 0.0, 1.0)
    colmap = gradient_colors(xf)                      # W x 3
    colored = line[:, :, None] * colmap[None, :, :]   # H x W x 3 (0..255)

    # 5) 左->右リビール用の累積インク
    cum = np.cumsum(col_ink)
    cum_prev = cum - col_ink
    total = float(cum[-1]) if cum[-1] > 0 else 1.0
    edge_ink = total * EDGE_FRAC

    # 6) キャンバス配置オフセット
    offx = (CANVAS_W - W) // 2
    offy = (CANVAS_H - H) // 2

    n_lead = int(round(LEAD_BLACK_S * FPS))
    n_write = int(round(WRITE_S * FPS))
    n_hold = int(round(HOLD_S * FPS))

    def save(canvas, idx):
        Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8)).save(
            os.path.join(FRAME_DIR, f"f{idx:04d}.png"))

    idx = 0
    black = np.zeros((CANVAS_H, CANVAS_W, 3), dtype=np.uint8)

    # 真っ黒のリード
    for _ in range(n_lead):
        save(black, idx); idx += 1

    # 書き上げ
    for i in range(n_write):
        p = smoothstep(i / max(1, n_write - 1))
        target = p * total
        reveal = np.clip((target - cum_prev) / edge_ink, 0.0, 1.0)  # W
        frame_sig = colored * reveal[None, :, None]
        canvas = black.copy().astype(np.float32)
        canvas[offy:offy + H, offx:offx + W, :] = frame_sig
        save(canvas, idx); idx += 1

    # 完成保持
    canvas = black.copy().astype(np.float32)
    canvas[offy:offy + H, offx:offx + W, :] = colored
    for _ in range(n_hold):
        save(canvas, idx); idx += 1

    print(f"frames={idx} canvas={CANVAS_W}x{CANVAS_H} sig={W}x{H} xext=({xmin},{xmax})")


if __name__ == "__main__":
    main()
