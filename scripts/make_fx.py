"""Original short synthesized game cues and original Lottie reward keyframes."""
import math,random,struct,wave,json
from pathlib import Path
root=Path(__file__).resolve().parents[1];rate=22050
for name,duration in [('tap',.06),('impact',.16),('reward',.55),('whoosh',.28),('tick',.035),('fail',.4)]:
 random.seed(11);out=[]
 for i in range(int(rate*duration)):
  t=i/rate;p=t/duration;env=min(1,t/.004)*(1-p)**2
  if name=='reward':hz=[523.25,659.25,783.99,1046.5][min(3,int(p*4))];v=math.sin(2*math.pi*hz*t)*.45
  elif name=='whoosh':v=random.uniform(-1,1)*math.sin(math.pi*p)*.5
  elif name=='impact':v=math.sin(2*math.pi*(90*t+3*(1-math.exp(-25*t))))*.6+random.uniform(-1,1)*.12
  elif name=='fail':v=math.sin(2*math.pi*(250*t-170*t*t))*.45
  else:v=math.sin(2*math.pi*(1250 if name=='tick' else 650)*t)*.35
  out.append(struct.pack('<h',int(v*env*28000)))
 with wave.open(str(root/f'assets/audio/{name}.wav'),'wb') as f:f.setparams((1,2,rate,0,'NONE','not compressed'));f.writeframes(b''.join(out))
colors=[[1,.36,.2,1],[.91,.94,.34,1],[.84,.94,1,1]];layers=[]
for i in range(12):
 a=i*math.pi/6;dest=[80+65*math.cos(a),80+65*math.sin(a),0]
 layers.append({'ddd':0,'ind':i+1,'ty':4,'nm':'Original reward spark','sr':1,'ks':{'o':{'a':1,'k':[{'t':0,'s':[100],'h':0},{'t':38,'s':[0]}]},'r':{'a':0,'k':i*30},'p':{'a':1,'k':[{'t':0,'s':[80,80,0],'e':dest,'o':{'x':.2,'y':0},'i':{'x':.4,'y':1}},{'t':38,'s':dest}]},'a':{'a':0,'k':[0,0,0]},'s':{'a':0,'k':[100,100,100]}},'shapes':[{'ty':'el','p':{'a':0,'k':[0,0]},'s':{'a':0,'k':[7,13]},'nm':'Spark'},{'ty':'fl','c':{'a':0,'k':colors[i%3]},'o':{'a':0,'k':100}}],'ip':0,'op':45,'st':0,'bm':0})
(root/'assets/animations/reward.json').write_text(json.dumps({'v':'5.7.4','fr':30,'ip':0,'op':45,'w':160,'h':160,'nm':'funsplit original reward burst','ddd':0,'assets':[],'layers':layers}))
