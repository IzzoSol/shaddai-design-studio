"""score3.py — the "Nine Lives" score (184 s). Takes the v2 score (score2.py → 128 s) and splices in
original cues for the cat's chapters at the same points the film inserts them.
Usage: python3 score2.py /tmp/v2.wav && python3 score3.py /tmp/v2.wav assets/score.wav"""
import sys, wave
import numpy as np

SR = 44100
with wave.open(sys.argv[1]) as w:
    v2 = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2).astype(np.float64) / 32767
rng = np.random.default_rng(9)

def T(d): return np.arange(int(SR * d)) / SR
def env(t, a, b, fi=0.3, fo=0.3): return np.clip((t - a) / max(fi, 1e-3), 0, 1) * np.clip((b - t) / max(fo, 1e-3), 0, 1) * ((t >= a) & (t <= b))
def tone(t, f, harm=(1, 0.4, 0.15)): return sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(harm))
def pad(t, fs, det=0.4): return sum(tone(t, f) + tone(t, f + det) for f in fs) / (2 * len(fs))
def pluck(t, at, f, dec=3.0, amp=0.3):
    m = t >= at; o = np.zeros_like(t); tt = t[m] - at; o[m] = amp * np.sin(2 * np.pi * f * tt) * np.exp(-tt * dec) * (1 + 0.3 * np.sin(2 * np.pi * f * 2 * tt)); return o
def hit(t, at, hi=90, lo=38, dec=0.6, amp=0.6):
    m = t >= at; o = np.zeros_like(t); tt = t[m] - at; f = lo + (hi - lo) * np.exp(-tt * 9); o[m] = amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / dec); return o
def clicks(t, a, b, rate, f=2400, amp=0.12, jitter=0.0, seed=1):
    r = np.random.default_rng(seed); o = np.zeros_like(t); s = a
    while s < b:
        m = (t >= s) & (t < s + 0.02); tt = t[m] - s; o[m] += amp * np.sin(2 * np.pi * f * tt) * np.exp(-tt * 220); s += (1 / rate) * (1 + jitter * (r.random() - 0.5))
    return o
def lp(x, a):
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x): acc += a * (v - acc); y[i] = acc
    return y
A1, E2, A2, C3, D3, E3, G3, A3, B3, Cs4, E4 = 55, 82.41, 110, 130.81, 146.83, 164.81, 196.0, 220, 246.94, 277.18, 329.63

def cold_open():  # 7 s: drone, one heartbeat, shimmer as the eye opens
    t = T(7); o = 0.25 * pad(t, [A1, E2]) * env(t, 0, 7, 1.5, 0.8)
    o += hit(t, 1.0, 60, 40, 0.15, 0.7) + hit(t, 1.25, 55, 40, 0.15, 0.5)
    o += 0.07 * np.sin(2 * np.pi * (1760 + 300 * t) * t) * env(t, 1.0, 4.0, 1.0, 1.5)
    o += 0.18 * pad(t, [A2, E3, A3]) * env(t, 3.2, 7, 1.0, 0.6)
    return o

def lives_a():  # 16 s: Tesla (crackle, thunder) · Boxing Cats (projector, ragtime) · Schrödinger (theremin)
    t = T(16); n = rng.standard_normal(len(t)); o = np.zeros_like(t)
    crack = (n * (rng.random(len(t)) < 0.004)) * 0.9; o += crack * env(t, 0.6, 5.3, 0.2, 0.3)
    o += 0.25 * lp(n, 0.01) * env(t, 0, 5.4, 0.4, 0.4)                       # wind
    o += 0.6 * lp(n, 0.02) * np.exp(-np.clip(t - 2.1, 0, None) * 1.6) * (t >= 2.1) * (t < 5.3)  # thunder
    o += 0.18 * pad(t, [A1, E2, A2]) * env(t, 0, 5.4, 0.3, 0.4)
    o += clicks(t, 5.3, 10.6, 18, f=900, amp=0.1, jitter=0.2)               # projector
    rag = [523.25, 659.25, 783.99, 659.25, 698.46, 587.33, 523.25, 392.0, 440, 523.25, 587.33, 659.25]
    for i, f in enumerate(rag): o += pluck(t, 5.6 + i * 0.4, f, 6, 0.16) + pluck(t, 5.6 + i * 0.4, f / 4, 5, 0.1)
    gl = 440 * 2 ** (np.sin(2 * np.pi * 0.6 * t) * 0.5)                      # theremin
    o += 0.14 * np.sin(2 * np.pi * np.cumsum(gl) / SR) * env(t, 10.6, 16, 0.4, 0.4)
    o += 0.2 * pad(t, [A1, D3 / 2, A2]) * env(t, 10.6, 16, 0.4, 0.5)
    return o

def lives_b():  # 16 s: neuron crackle · rocket countdown + rumble · bell and pentatonic
    t = T(16); n = rng.standard_normal(len(t)); o = np.zeros_like(t)
    ang = -0.9 + t * 0.42; rate = np.maximum(0, np.cos(ang - 0.6)) ** 12
    spikes = (rng.random(len(t)) < (0.0004 + rate * 0.006)) * 1.0
    o += lp(spikes, 0.5) * 0.9 * env(t, 0.2, 5.3, 0.2, 0.2)
    o += 0.16 * pad(t, [A1, E2]) * env(t, 0, 5.3, 0.3, 0.3)
    for i in range(3): o += pluck(t, 5.4 + i * 0.4, 880, 30, 0.2)
    o += 0.7 * lp(n, 0.015) * env(t, 6.6, 10.6, 0.8, 0.4) * np.clip((t - 6.6) / 2, 0, 1)   # rumble
    o += 0.2 * pad(t, [A2, E3, A3]) * env(t, 7.5, 10.6, 1.5, 0.4)
    pent = [659.25, 783.99, 880, 1046.5, 880, 783.99, 659.25, 783.99, 1046.5, 1174.66]
    for i, f in enumerate(pent): o += pluck(t, 10.8 + i * 0.5, f, 5, 0.14)
    o += pluck(t, 10.7, 2093, 2.5, 0.12) + pluck(t, 12.9, 2093, 2.5, 0.1)    # bell
    o += 0.18 * pad(t, [A2, Cs4 / 2, E3]) * env(t, 10.6, 16, 0.3, 0.5)
    return o

def lives_c():  # 9 s: demolition, then quiet · data arpeggio that resolves when the cat appears
    t = T(9); n = rng.standard_normal(len(t)); o = np.zeros_like(t)
    o += hit(t, 0.8, 120, 30, 1.2, 0.9) + hit(t, 1.5, 90, 30, 0.8, 0.6) + hit(t, 2.2, 80, 28, 0.9, 0.5)
    o += 0.5 * lp(n, 0.05) * env(t, 0.8, 3.4, 0.05, 1.0)
    o += 0.14 * pad(t, [E2, B3 / 2]) * env(t, 2.8, 4.5, 0.5, 0.3)
    arp = [A3, C3 * 2, E4, A3 * 2]
    for i in range(16): o += pluck(t, 4.6 + i * 0.12, arp[i % 4] * (1 + (i // 8)), 14, 0.1)
    o += 0.3 * pad(t, [A2, Cs4 / 2, E3, A3]) * env(t, 6.6, 9, 0.4, 0.5)
    o += clicks(t, 4.5, 6.6, 26, f=4200, amp=0.05, seed=3)
    return o

def life_nine():  # 8 s: coin chimes building into the close
    t = T(8); o = np.zeros_like(t); r = np.random.default_rng(5)
    for i in range(40): at = r.random() * 6; o += pluck(t, at, [1318.5, 1567.98, 1760, 2093][i % 4], 9, 0.06)
    o += 0.3 * pad(t, [A1, E2, A2, Cs4 / 2]) * env(t, 0, 8, 1.0, 0.3) * np.clip(t / 6, 0.3, 1)
    o += hit(t, 3.0, 110, 35, 0.9, 0.6)
    return o

# splice: v2 segments and new cues, with short crossfades
INS = [(0, cold_open), (45, lives_a), (63, lives_b), (80, lives_c), (120, life_nine)]
F = int(SR * 0.03); parts = []; prev = 0.0   # 30 ms fades at every join; no samples dropped, so sync holds
for at, cue in INS:
    seg = v2[int(prev * SR):int(at * SR)]
    if len(seg): parts.append(seg.copy())
    c = cue(); parts.append(np.stack([c, c], 1) * 0.76); prev = at
parts.append(v2[int(prev * SR):].copy())
ramp = np.linspace(0, 1, F)[:, None]
for p in parts:
    if len(p) > 2 * F: p[:F] *= ramp; p[-F:] *= ramp[::-1]
out = np.concatenate(parts)
out = np.tanh(out * 1.1); out = out / np.abs(out).max() * 0.89
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes())
print('wrote', len(out) / SR, 's')
