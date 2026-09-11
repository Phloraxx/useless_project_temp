#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROBE="$ROOT/tools/ffprobe"
FF="$ROOT/tools/ffmpeg"
RUNTIME="$ROOT/runtime"
PUBLIC="$ROOT/public/audio"
EXPECTED=20
count=$(find "$RUNTIME" -maxdepth 1 -name '*.ogg' | wc -l | tr -d ' ')
[[ "$count" == "$EXPECTED" ]] || { echo "FAIL: expected $EXPECTED OGG files, found $count"; exit 1; }
(cd "$RUNTIME" && sha256sum -c SHA256SUMS.txt >/dev/null)

stereo_files=" ambience-kerala-loop.ogg ambience-kerala-night-loop.ogg bus-rattle-loop.ogg rain-roof-loop.ogg road-cabin-loop.ogg "
for f in "$RUNTIME"/*.ogg; do
  name=$(basename "$f")
  rate=$($PROBE -v error -select_streams a:0 -show_entries stream=sample_rate -of csv=p=0 "$f")
  channels=$($PROBE -v error -select_streams a:0 -show_entries stream=channels -of csv=p=0 "$f")
  duration=$($PROBE -v error -show_entries format=duration -of csv=p=0 "$f")
  [[ "$rate" == "48000" ]] || { echo "FAIL: $name is ${rate}Hz"; exit 1; }
  expected_channels=1
  [[ "$stereo_files" == *" $name "* ]] && expected_channels=2
  [[ "$channels" == "$expected_channels" ]] || { echo "FAIL: $name channels=$channels expected=$expected_channels"; exit 1; }
  python3 - <<PY
import sys
if float("$duration") <= 0.25:
    sys.exit("FAIL: $name duration too short: $duration")
PY
  [[ -f "$PUBLIC/$name" ]] || { echo "FAIL: public mirror missing $name"; exit 1; }
  cmp -s "$f" "$PUBLIC/$name" || { echo "FAIL: public mirror differs for $name"; exit 1; }
  peak=$($FF -hide_banner -i "$f" -af volumedetect -f null - 2>&1 | awk '/max_volume:/ {print $(NF-1)}')
  python3 - <<PY
import sys
peak=float("$peak")
if peak > -1.0:
    sys.exit("FAIL: $name decoded max peak is too hot: %.2f dB" % peak)
PY
done

echo "PASS: $EXPECTED runtime OGGs; hashes/mirror/rate/channels/durations/peaks verified."
