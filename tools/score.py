# -*- coding: utf-8 -*-
"""Procedural soundtrack for 《遗憾》 — piano + pads + rain, 160s, 44.1kHz stereo.
Mirrors CHORDS / MELODY embedded in index.html."""
import numpy as np, wave, struct

SR = 44100
DUR = 160.0
N = int(SR * DUR)
rng = np.random.default_rng(20261117)

CHORDS = [
    (0,[45,52,57,60]),(8,[45,52,57,60]),(16,[41,48,53,57]),(24,[48,55,60,64]),
    (32,[43,50,55,59]),(40,[45,52,57,60]),(48,[41,48,53,57]),(56,[48,55,60,64]),
    (64,[50,57,62,65]),(72,[45,52,57,60]),(80,[41,48,53,57]),(88,[48,55,60,64]),
    (96,[43,50,55,59]),(104,[50,57,62,65]),(112,[40,47,52,56]),(120,[45,52,57,60]),
    (128,[41,48,53,57]),(136,[43,50,55,59]),(144,[48,55,60,64]),(152,[45,52,57,59]),
]
MELODY = [
    (2,76,2.5,.7),(5,72,2.5,.6),(8,69,3.5,.75),(12,67,2.5,.55),
    (18,69,1.6,.6),(20,72,1.6,.65),(22,76,2.6,.75),(26,74,2,.6),(29,72,2.2,.6),
    (33,69,3,.7),(38,67,2,.5),(41,64,3,.55),
    (48,72,2,.65),(51,74,2,.65),(54,76,3,.8),(58,72,2,.6),(61,69,3,.7),(66,67,2,.55),(69,69,4,.65),
    (74,76,1.6,.6),(76,81,2.2,.7),(79,79,1.6,.6),(81,76,2,.6),(84,72,2,.6),(87,74,2,.6),
    (90,72,2.6,.65),(94,69,3,.6),
    (100,62,2.2,.55),(104,65,2.2,.55),(108,64,3,.6),(113,59,2.2,.5),(116,56,3,.55),(120,57,4,.6),
    (124,72,1.6,.6),(126,74,1.6,.6),(128,76,2.2,.7),(131,79,2.2,.7),(134,81,3,.8),
    (138,79,2,.6),(140,76,3,.65),
    (144,76,2.2,.7),(147,72,2.2,.65),(150,69,3.2,.75),(153,71,2.2,.6),(155,69,5,.8),
]

def midi(m): return 440.0 * 2 ** ((m - 69) / 12)

def smooth_env(t, a, b, f):
    x = np.clip((t - a) / f, 0, 1); y = np.clip((b - t) / f, 0, 1)
    return (x * x * (3 - 2 * x)) * (y * y * (3 - 2 * y))

def add(buf, sig, at):
    i = int(at * SR)
    if i >= N: return
    j = min(N, i + len(sig))
    buf[i:j] += sig[: j - i]

musicL = np.zeros(N); musicR = np.zeros(N)

# ---- piano ----
for k, (t0, m, d, v) in enumerate(MELODY):
    f = midi(m)
    length = int((d + 3.0) * SR)
    tt = np.arange(length) / SR
    tau = d * 0.55 + 0.45
    sig = np.zeros(length)
    for h in range(1, 7):
        fh = f * h * (1 + (h - 1) * 0.0004)
        if fh > SR / 2: break
        amp = h ** -1.7
        th = tau / (h ** 0.6)
        sig += amp * np.sin(2 * np.pi * fh * tt + rng.uniform(0, 6.28)) * np.exp(-tt / th)
    atk = np.minimum(tt / 0.005, 1.0)
    sig *= atk * np.exp(-tt / (tau * 3.2)) * v * 0.22
    # hammer transient
    hn = int(0.018 * SR)
    hammer = rng.standard_normal(hn) * np.exp(-np.arange(hn) / (0.004 * SR)) * 0.05 * v
    sig[:hn] += hammer
    pan = 0.12 * np.sin(k * 1.7)
    add(musicL, sig * (1 - pan), t0)
    add(musicR, sig * (1 + pan), t0)

# ---- pads ----
for (t0, ms) in CHORDS:
    d = 8.0
    length = int(d * SR)
    tt = np.arange(length) / SR
    envp = np.minimum(tt / 2.4, 1.0) * np.minimum((d - tt) / 2.6, 1.0)
    envp = np.clip(envp, 0, 1)
    for m in ms:
        f = midi(m)
        for det, L, Rr in ((-4, 1, 0), (4, 0, 1)):
            fd = f * 2 ** (det / 1200)
            s = (np.sin(2 * np.pi * fd * tt) + 0.35 * np.sin(2 * np.pi * fd * 2 * tt)) * envp * 0.028
            add(musicL, s * L, t0); add(musicR, s * Rr, t0)

# ---- reverb (multi-tap) on music bus ----
def reverb(x):
    y = x.copy()
    for dt, g in ((0.29, .32), (0.43, .24), (0.57, .17), (0.71, .11)):
        n = int(dt * SR)
        y[n:] += x[:-n] * g
    return y
musicL = reverb(musicL); musicR = reverb(musicR)

# ---- rain (train scene 44-72s) ----
t_axis = np.arange(N) / SR
noise = rng.standard_normal(N)
spec = np.fft.rfft(noise)
freqs = np.fft.rfftfreq(N, 1 / SR)
spec *= 1 / (1 + (freqs / 900) ** 2)
rain = np.fft.irfft(spec, N)
rain *= smooth_env(t_axis, 44, 72, 4) * 0.05
rain /= max(1e-9, np.max(np.abs(rain))) / 0.9

# ---- vinyl crackle, very quiet ----
crackle = np.zeros(N)
times = np.sort(rng.uniform(0, DUR, 420))
for ct in times:
    i = int(ct * SR); ln = int(0.004 * SR)
    if i + ln < N:
        crackle[i:i + ln] += rng.uniform(0.01, 0.04) * np.exp(-np.arange(ln) / (0.001 * SR)) * rng.choice([-1, 1])

# ---- mix & master ----
L = musicL + rain * 0.9 + crackle
R = musicR + rain * 1.1 + crackle
def lowpass(x, fc):
    s = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    s *= 1 / (1 + (f / fc) ** 3)
    return np.fft.irfft(s, len(x))
L = lowpass(L, 7000); R = lowpass(R, 7000)
mixx = np.stack([L, R])
mixx = np.tanh(mixx * 1.15) / 1.15
peak = np.max(np.abs(mixx))
mixx *= 0.89 / peak
fade_in = np.clip(t_axis / 1.2, 0, 1)
fade_out = np.clip((DUR - t_axis) / 5.0, 0, 1)
fade_out = fade_out * fade_out * (3 - 2 * fade_out)
mixx *= (fade_in * fade_out)[None, :]

pcm = (mixx.T * 32767).astype(np.int16)
with wave.open("soundtrack.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("soundtrack.wav written:", pcm.shape, "peak", float(np.max(np.abs(mixx))))