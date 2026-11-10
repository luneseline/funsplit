"""Generate an original four-bar arcade loop. No third-party samples."""
import math,random,struct,wave
from pathlib import Path
random.seed(7)
RATE=22050; BPM=120; beat=60/BPM; duration=16*beat
samples=[0.0]*int(RATE*duration)
def tone(start,length,hz,volume,kind='pluck'):
 for i in range(min(int(length*RATE),len(samples)-int(start*RATE))):
  t=i/RATE; env=min(1,t/.007)*math.exp(-t*(8 if kind=='pluck' else 4))
  value=(math.sin(2*math.pi*hz*t)+.24*math.sin(4*math.pi*hz*t)) if kind!='kick' else math.sin(2*math.pi*(50*t+6*(1-math.exp(-30*t))))
  samples[int(start*RATE)+i]+=value*env*volume
melody=[72,76,79,76,74,77,81,77,71,74,79,74,72,76,79,83,72,79,76,79,74,81,77,81,71,79,74,79,72,76,79,72]
for i,note in enumerate(melody):tone(i*beat/2,.23,440*2**((note-69)/12),.11)
for b in range(16):
 tone(b*beat,.3,52,.24,'kick')
 tone(b*beat,.4,440*2**(([48,53,43,48][b//4]-69)/12),.15)
 for sub in [0,.5]:
  start=int((b+sub)*beat*RATE)
  for j in range(int(.045*RATE)):
   if start+j<len(samples):samples[start+j]+=random.uniform(-1,1)*.035*math.exp(-j/(RATE*.012))
 # quiet handclap on the backbeat
 if b%2:
  start=int(b*beat*RATE)
  for j in range(int(.09*RATE)):
   if start+j<len(samples):samples[start+j]+=random.uniform(-1,1)*.08*math.exp(-j/(RATE*.025))
# Prevent hard-edge clicks; last sustained tails are faded.
for i in range(int(RATE*.03)):samples[-i-1]*=i/(RATE*.03)
out=Path(__file__).resolve().parents[1]/'assets/audio/table-party.wav'
with wave.open(str(out),'wb') as f:
 f.setparams((1,2,RATE,0,'NONE','not compressed'));f.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,v))*25000)) for v in samples))
