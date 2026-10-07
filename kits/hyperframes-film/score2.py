"""score2.py — original synthesized score for "The First Law" (120 s, 44.1 kHz stereo WAV).
Cues follow SCRIPT.md: lab hum → siren + rising pulse (breach) → near-silence and a heartbeat (the choice) →
implosion → history (typewriter, clocks) → tunnel rain and dread → AI montage drive → resolve →
epilogue purr and a chime as R-7's eye relights → close.   Usage: python3 score2.py assets/score.wav"""
import sys, wave
import numpy as np

SR, DUR = 44100, 128.0
t = np.arange(int(SR * DUR)) / SR
rng = np.random.default_rng(11)

def env(a, b, fi=1.0, fo=1.0):
    return np.clip((t - a) / max(fi, 1e-3), 0, 1) * np.clip((b - t) / max(fo, 1e-3), 0, 1) * ((t >= a) & (t <= b))
def tone(f, det=0.0, harm=(1, 0.5, 0.25, 0.12)):
    o = np.zeros_like(t)
    for i, a in enumerate(harm, 1): o += a * 0.5 * (np.sin(2 * np.pi * f * i * t) + np.sin(2 * np.pi * (f * i + det) * t + 1.3))
    return o
def pad(fs, det=0.35): return sum(tone(f, det) for f in fs) / len(fs)
def hits(times, hi=90.0, lo=38.0, decay=0.9, amp=1.0):
    o = np.zeros_like(t)
    for s in times:
        m = t >= s; tt = t[m] - s; f = lo + (hi - lo) * np.exp(-tt * 9)
        o[m] += amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / decay)
    return o
def ticks(a, b, ra, rb, f=2200.0, amp=0.18):
    o = np.zeros_like(t); s = a
    while s < b:
        k = (s - a) / (b - a); m = (t >= s) & (t < s + 0.03); tt = t[m] - s
        o[m] += amp * np.sin(2 * np.pi * f * tt) * np.exp(-tt * 160); s += 1.0 / (ra + (rb - ra) * k)
    return o
def noise(): return rng.standard_normal(len(t))
def lowpass(x, a=0.02):
    y = np.empty_like(x); acc = 0.0
    for i in range(0, len(x), 4096):  # block IIR (fast enough, smooth enough)
        blk = x[i:i + 4096]; out = np.empty_like(blk)
        for j, v in enumerate(blk): acc += a * (v - acc); out[j] = acc
        y[i:i + 4096] = out
    return y
def lfo(r, d=0.3, p=0.0): return 1 - d + d * np.sin(2 * np.pi * r * t + p)

A1, E2, A2, C3, D3, E3, G3, A3, B3, Cs4, E4 = 55, 82.41, 110, 130.81, 146.83, 164.81, 196.0, 220, 246.94, 277.18, 329.63
n = noise()
mix = np.zeros_like(t)

# ACT I ─ the lab hum (electrical 60 Hz family) and a held-breath drone
mix += 0.22 * tone(60, 0.2, (1, 0.6, 0.3, 0.2)) * env(0.0, 16.2, 2.0, 0.3)
mix += 0.20 * pad([A1, E2, A2]) * lfo(0.15, 0.4) * env(0.0, 16.4, 3.0, 0.4)
mix += hits([15.6], hi=60, lo=40, decay=0.2, amp=0.4)                                           # the hum skips
# breach: two-tone siren + accelerating pulse + rising minor cluster
siren_f = np.where((np.floor(t * 1.5) % 2) == 0, 880.0, 660.0)
siren = np.sin(2 * np.pi * np.cumsum(siren_f) / SR)
mix += 0.07 * siren * env(16.0, 32.4, 0.05, 0.6)
mix += 0.28 * pad([A1, E2, A2, C3, D3]) * env(16.0, 32.6, 0.3, 0.5)
mix += hits([16.0], hi=140, lo=30, decay=1.4, amp=0.9)
mix += hits(list(np.arange(16.0, 32.0, 0.5) + 0.0), hi=70, lo=45, decay=0.18, amp=0.35)
mix += ticks(24.0, 32.4, 4, 10, f=1800, amp=0.08)
# the choice: everything drops, a heartbeat under silence
mix += hits([32.5], hi=110, lo=35, decay=0.8, amp=0.6)
beats = []
for b in np.arange(33.2, 40.4, 0.86): beats += [b, b + 0.22]
mix += hits(beats, hi=55, lo=40, decay=0.12, amp=0.55)
mix += 0.10 * pad([E3, B3]) * env(34.0, 40.5, 2.5, 0.05)                                         # a thin high line rising
# implosion and ringing tail
mix += hits([40.5], hi=160, lo=25, decay=2.2, amp=1.15)
mix += 0.35 * lowpass(n, 0.08) * np.exp(-np.clip(t - 40.5, 0, None) * 2.5) * (t >= 40.5) * (t < 43)
mix += 0.08 * tone(E4 * 2, 0.5, (1,)) * env(40.6, 45.0, 0.02, 3.0)

# ACT II ─ history: warm pad, typewriter, clocks
mix += 0.28 * pad([A1, E2, A2, E3, B3]) * lfo(0.12, 0.2) * env(45.0, 63.2, 1.0, 0.5)
mix += hits([45.0], amp=0.6)
mix += ticks(53.2, 62.8, 7, 7, f=1300, amp=0.07)                                                # typewriter on the laws
mix += hits([52.0, 61.2], hi=70, lo=45, decay=0.5, amp=0.5)
mix += 0.25 * pad([A1, E2, A2, C3, G3]) * env(63.0, 70.2, 0.4, 0.3)
mix += ticks(63.0, 70.0, 3, 7)
mix += 0.12 * tone(A1 / 2, 0.2, (1, 0.6)) * env(65.2, 66.8, 0.1, 0.5)                          # 1984 growl
# tunnel: rain, dread drone, stabs on the lines, a shout accent
rain = (n - lowpass(n, 0.15)) * 0.22
mix += rain * env(70.0, 80.0, 0.6, 0.6)
mix += 0.30 * pad([A1 * 0.75, E2 * 0.75, A2 * 0.75 * 1.059]) * env(70.0, 80.0, 0.8, 0.4)          # flat-ninth dread
mix += hits([71.5, 73.5, 75.3], hi=80, lo=40, decay=0.5, amp=0.45)
mix *= 1 - 0.7 * env(76.8, 79.9, 0.15, 0.3)          # duck under the film dialogue
mix += hits([79.9], hi=110, lo=32, decay=0.8, amp=0.5)

# ACT III ─ montage drive
mix += hits([80.0], hi=120, lo=30, decay=1.2, amp=0.6)
bass = np.sign(np.sin(2 * np.pi * A1 * t)) * 0.5 + np.sin(2 * np.pi * A1 * t) * 0.5
mix += 0.11 * bass * (np.sin(2 * np.pi * 4.0 * t) > 0) * env(81.6, 93.0, 0.4, 0.5)
mix += 0.22 * pad([A2, C3, E3, G3]) * env(81.6, 93.0, 1.0, 0.6)
mix += ticks(81.6, 93.0, 8, 8, f=3200, amp=0.07)
mix += hits([81.6 + i * 2.3 for i in range(5)], amp=0.55)
# the question: resolve to A major
# 2026 · the Hugging Face incident: data blips, a tight pulse, dread that resolves into the question
mix += ticks(93.0, 100.8, 10, 18, f=4200, amp=0.06)
mix += 0.24 * pad([A1, E2 * 1.059, A2]) * env(93.0, 101.0, 0.3, 0.6)
mix += 0.10 * bass * (np.sin(2 * np.pi * 3.0 * t) > 0) * env(93.4, 99.0, 0.3, 0.3)
mix += hits([93.0, 98.4], hi=110, lo=35, decay=0.9, amp=0.7)
mix += hits([99.0], hi=60, lo=40, decay=1.6, amp=0.5)
# the question: resolve to A major
mix += 0.34 * pad([A1, E2, A2, Cs4 / 2, E3]) * lfo(0.1, 0.15) * env(100.8, 112.4, 1.2, 0.8)
# epilogue: near silence, a purr, then the chime as the eye relights
purr = lowpass(n, 0.05) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 24 * t))) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.45 * t))
mix += 0.9 * purr * env(116.6, 120.4, 0.8, 0.8)
mix += 0.10 * pad([A2, E3]) * env(112.0, 120.0, 1.5, 0.5)
for f, d in ((A3 * 2, 0), (Cs4 * 2, 0.08), (E4 * 2, 0.16)):
    m = t >= 118.45 + d; tt = t[m] - 118.45 - d
    mix[m] += 0.12 * np.sin(2 * np.pi * f * tt) * np.exp(-tt * 1.6)
# close
mix += 0.46 * pad([A1, E2, A2, Cs4 / 2, E3, A3]) * env(120.0, 128.0, 0.5, 3.5)
mix += 0.10 * tone(E4, 0.6, (1, 0.3)) * env(121.4, 128.0, 0.3, 3.5)
mix += hits([120.0, 121.4], amp=0.75)

mix = np.tanh(mix * 1.35) * 0.8
L = mix * (0.92 + 0.08 * np.sin(2 * np.pi * 0.07 * t)); R = mix * (0.92 + 0.08 * np.cos(2 * np.pi * 0.07 * t))
peak = max(np.abs(L).max(), np.abs(R).max())
st = (np.stack([L, R], 1) / peak * 0.89 * 32767).astype(np.int16)
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'score.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print('wrote', len(st) / SR, 's')
