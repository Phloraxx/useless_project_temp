#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FF="$ROOT/tools/ffmpeg"
PROBE="$ROOT/tools/ffprobe"
RAW="$ROOT/raw/freesound"
OUT="$ROOT/runtime"
PUB="$ROOT/public/audio"
mkdir -p "$OUT" "$PUB"

loop_mono(){ # src out crossfade targetLUFS [trimStart] [trimEnd]
  local src="$1" out="$2" xf="$3" lufs="$4" start="${5:-0}" end="${6:-}"
  local dur
  if [[ -n "$end" ]]; then dur=$(python3 -c "print(float('$end')-float('$start'))"); else dur=$($PROBE -v error -show_entries format=duration -of default=nw=1:nk=1 "$src"); fi
  local seamStart midEnd
  seamStart=$(python3 -c "print(max(0.01,float('$dur')-float('$xf')))")
  midEnd="$seamStart"
  local trim=""
  if [[ "$start" != "0" || -n "$end" ]]; then trim="atrim=start=$start${end:+:end=$end},asetpts=PTS-STARTPTS,"; fi
  "$FF" -hide_banner -loglevel error -y -i "$src" -filter_complex "[0:a]${trim}asplit=3[a][h][t];[a]atrim=start=$xf:end=$midEnd,asetpts=PTS-STARTPTS[mid];[t]atrim=start=$seamStart:end=$dur,asetpts=PTS-STARTPTS[tail];[h]atrim=start=0:end=$xf,asetpts=PTS-STARTPTS[head];[tail][head]acrossfade=d=$xf:c1=tri:c2=tri[seam];[mid][seam]concat=n=2:v=0:a=1,pan=mono|c0=0.5*c0+0.5*c1,loudnorm=I=$lufs:LRA=12:TP=-2,aresample=48000[out]" -map '[out]' -c:a libvorbis -q:a 4 "$OUT/$out"
}

loop_stereo(){ # src out crossfade targetLUFS trimStart trimEnd
  local src="$1" out="$2" xf="$3" lufs="$4" start="$5" end="$6"
  local dur seamStart
  dur=$(python3 -c "print(float('$end')-float('$start'))")
  seamStart=$(python3 -c "print(max(0.01,float('$dur')-float('$xf')))")
  "$FF" -hide_banner -loglevel error -y -i "$src" -filter_complex "[0:a]atrim=start=$start:end=$end,asetpts=PTS-STARTPTS,asplit=3[a][h][t];[a]atrim=start=$xf:end=$seamStart,asetpts=PTS-STARTPTS[mid];[t]atrim=start=$seamStart:end=$dur,asetpts=PTS-STARTPTS[tail];[h]atrim=start=0:end=$xf,asetpts=PTS-STARTPTS[head];[tail][head]acrossfade=d=$xf:c1=tri:c2=tri[seam];[mid][seam]concat=n=2:v=0:a=1,loudnorm=I=$lufs:LRA=12:TP=-2,aresample=48000[out]" -map '[out]' -c:a libvorbis -q:a 4 "$OUT/$out"
}

oneshot(){ # src out targetLUFS [trimStart] [trimEnd] [mono]
  local src="$1" out="$2" lufs="$3" start="${4:-0}" end="${5:-}" mono="${6:-yes}"
  local trim="atrim=start=$start${end:+:end=$end},asetpts=PTS-STARTPTS,"
  local pan=""; [[ "$mono" == yes ]] && pan="pan=mono|c0=0.5*c0+0.5*c1,"
  "$FF" -hide_banner -loglevel error -y -i "$src" -af "${trim}${pan}loudnorm=I=$lufs:LRA=12:TP=-2,afade=t=in:st=0:d=0.012,areverse,afade=t=in:st=0:d=0.018,areverse,aresample=48000" -c:a libvorbis -q:a 4 "$OUT/$out"
}

# Engine palette: loop identity comes from separate real bus recordings, not wide pitch shifting.
loop_mono "$RAW/bus-idle-803762.mp3" engine-idle.ogg 0.12 -22
loop_mono "$RAW/bus-low-803767.mp3" engine-low.ogg 0.07 -21
loop_mono "$RAW/bus-mid-803761.mp3" engine-mid.ogg 0.10 -21
loop_mono "$RAW/bus-high-803766.mp3" engine-high.ogg 0.05 -21
oneshot "$RAW/bus-takeoff-803763.mp3" engine-takeoff.ogg -19
oneshot "$RAW/bus-shift-803768.mp3" gear-shift.ogg -18
oneshot "$RAW/bus-to-idle-803764.mp3" engine-to-idle.ogg -20
oneshot "$RAW/air-brake-801435.mp3" air-brake-release.ogg -18
oneshot "$RAW/brake-squeal-104026.mp3" brake-squeal.ogg -22

# Mechanics / controls.
oneshot "$RAW/conductor-bell-475211.mp3" conductor-bell.ogg -19
oneshot "$RAW/door-open-446458.mp3" door-open.ogg -19 0.18
oneshot "$RAW/door-close-837919.mp3" door-close.ogg -19
oneshot "$RAW/horn-heavy-bus-451697.mp3" horn-short.ogg -18 0 1.35
loop_mono "$RAW/horn-heavy-bus-451697.mp3" horn-held.ogg 0.12 -19
loop_mono "$RAW/wiper-interior-50768.mp3" wiper-loop.ogg 0.18 -25

# Continuous beds. These remain stereo so motion and rain do not collapse to the center.
loop_stereo "$RAW/road-cabin-860717.mp3" road-cabin-loop.ogg 1.20 -28 8 68
loop_stereo "$RAW/bus-rattle-128290.mp3" bus-rattle-loop.ogg 1.00 -31 18 58
loop_stereo "$RAW/rain-roof-interior-650774.mp3" rain-roof-loop.ogg 1.50 -28 18 78
loop_stereo "$RAW/ambience-kerala-585570.mp3" ambience-kerala-loop.ogg 1.50 -30 5 65
loop_stereo "$RAW/ambience-kerala-night-515515.mp3" ambience-kerala-night-loop.ogg 1.20 -31 2 50

rm -f "$PUB"/*.ogg
cp "$OUT"/*.ogg "$PUB"/
(cd "$OUT" && sha256sum *.ogg > SHA256SUMS.txt)

echo "Processed $(find "$OUT" -maxdepth 1 -name '*.ogg' | wc -l) runtime assets."
