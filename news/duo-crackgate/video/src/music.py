import numpy as np, wave
from scipy.signal import butter, sosfilt, fftconvolve
SR=44100; BPM=128; B=60/BPM; TOTAL=50*B+0.4
N=int(SR*TOTAL); out=np.zeros((N,2))
rs=np.random.default_rng(3)
def T(b): return b*B
def add(sig,t,gain=1.0,pan=0.0):
    i=int(t*SR); 
    if i>=N: return
    sig=sig[:N-i]; l=np.cos((pan+1)*np.pi/4); r=np.sin((pan+1)*np.pi/4)
    out[i:i+len(sig),0]+=sig*gain*l*1.414; out[i:i+len(sig),1]+=sig*gain*r*1.414
def env(n,a=0.002,d=0.2,curve=6):
    t=np.arange(n)/SR; e=np.minimum(1,t/max(a,1e-4))*np.exp(-curve*np.maximum(0,t-a)/max(d,1e-4)); return e
def filt(x,kind,f,order=2):
    if isinstance(f,(list,tuple)): sos=butter(order,[f[0]/(SR/2),f[1]/(SR/2)],btype='band',output='sos')
    else: sos=butter(order,f/(SR/2),btype=kind,output='sos')
    return sosfilt(sos,x)
def noise(d): return rs.uniform(-1,1,int(SR*d))
def osc(freq,d,kind='saw'):
    t=np.arange(int(SR*d))/SR
    f=np.full_like(t,freq) if np.isscalar(freq) else freq
    ph=np.cumsum(f)/SR
    if kind=='saw': return 2*(ph%1)-1
    if kind=='sq': return np.sign(np.sin(2*np.pi*ph))
    if kind=='tri': return 2*np.abs(2*(ph%1)-1)-1
    return np.sin(2*np.pi*ph)
# ── drums
def kick():
    d=0.32; t=np.arange(int(SR*d))/SR; f=45+110*np.exp(-t*28)
    s=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*7.5); s+=filt(noise(d),'high',3000)*np.exp(-t*120)*0.25
    return np.tanh(s*1.6)
def clap():
    d=0.25; n=filt(noise(d),'band',(900,5000)); t=np.arange(len(n))/SR
    e=np.exp(-t*22)
    for k in (0.0,0.011,0.022): e+=np.exp(-np.maximum(0,t-k)*180)*(t>=k)*0.6
    return n*e*0.7
def hat(open_=False):
    d=0.25 if open_ else 0.05; n=filt(noise(d),'high',7500); t=np.arange(len(n))/SR
    return n*np.exp(-t*(14 if open_ else 90))*0.35
def snare():
    d=0.18; t=np.arange(int(SR*d))/SR; n=filt(noise(d),'band',(1500,7000))*np.exp(-t*30)
    tone=np.sin(2*np.pi*190*t)*np.exp(-t*40)*0.5; return (n+tone)*0.6
def tom(f0):
    d=0.35; t=np.arange(int(SR*d))/SR; f=f0*(1+0.6*np.exp(-t*20))
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)
# ── synths
NOTE=lambda m: 440*2**((m-69)/12)
PROG=[(45,[57,60,64]),(41,[57,60,65]),(48,[55,60,64]),(43,[55,59,62])]   # Am F C G
def bass_note(m,d=0.2):
    s=osc(NOTE(m),d,'saw')+0.5*osc(NOTE(m)/2,d,'sq'); s=filt(s,'low',900)
    return s*env(len(s),0.003,0.16,4)*0.55
def stab(ms,d=0.22,bright=3500):
    s=sum(osc(NOTE(m)*(1+dt),d,'saw') for m in ms for dt in (-0.004,0.004))/ (2*len(ms))
    s=filt(s,'low',bright); return s*env(len(s),0.002,0.12,5)
def blip(m,d=0.12):
    s=osc(NOTE(m),d,'sq')*0.5+osc(NOTE(m)*2,d,'sin')*0.5; return filt(s,'low',6000)*env(len(s),0.001,0.07,6)*0.5
def whoosh(d=0.35,up=True):
    n=noise(d); t=np.arange(len(n))/SR; k=t/d
    out=np.zeros_like(n); steps=12
    for i in range(steps):
        a,b=int(i*len(n)/steps),int((i+1)*len(n)/steps); f=300+6000*((i/steps) if up else 1-i/steps)
        out[a:b]=filt(n[a:b],'band',(f,f*1.6),1)
    return out*np.sin(np.pi*k)**2*0.5
# ── crack (웹 페이지의 '쩍' 소리를 그대로 옮김)
def crack(power=1.0):
    d=0.5; t=np.arange(int(SR*d))/SR
    snap=filt(filt(noise(d),'high',1800),'band',(2800,6500),1)
    e=np.where(t<0.002,t/0.002*1.4,1.4*np.exp(-(t-0.002)*50)); e=np.maximum(e,0.12*np.exp(-(t-0.045)*14)*(t>0.045))
    s=snap*e
    f=190*np.exp(-t*12)+48; body=osc(f,d,'tri')*0.9*np.exp(-t*28); s+=body
    for i in range(12):
        st=0.02+rs.uniform(0,0.24)+i*0.012; n=int(0.02*SR); a=int(st*SR)
        if a+n<len(s):
            c=filt(noise(0.02),'band',(2500+rs.uniform(0,4000),9000),1)*np.exp(-np.arange(n)/SR*220)*rs.uniform(.4,.8)
            s[a:a+n]+=c
    sub=np.sin(2*np.pi*np.cumsum(70*np.exp(-t*5)+32)/SR)*np.exp(-t*4)*0.9
    return np.tanh((s*1.3+sub)*power)
def buzz(d=0.45):
    t=np.arange(int(SR*d))/SR; s=osc(58,d,'sq')*0.5+filt(noise(d),'band',(900,1600))*0.8
    return s*np.exp(-t*7)*0.35
def reverb(x,dur=1.8,mix=0.35):
    n=int(SR*dur); ir=rs.uniform(-1,1,n)*np.exp(-np.arange(n)/SR*4); ir=filt(ir,'low',5000); ir/=np.abs(ir).sum()**0.5*6
    return x+fftconvolve(x,ir)[:len(x)]*mix

END_MUSIC=37.0
# 드럼 패턴
for bt in np.arange(0,END_MUSIC,0.25):
    beat=bt; inbreak=30.0<=beat<32.0
    if beat%1==0 and not inbreak: add(kick(),T(beat),0.95)
    if beat%2==1 and not inbreak and beat<32: add(clap(),T(beat),0.55,0.1)
    if beat<32:
        if beat%0.5==0.25 or (beat%0.5==0 and beat%1!=0): add(hat(beat%1==0.5),T(beat),0.5 if beat%1==0.5 else 0.3,-0.3)
        elif not inbreak: add(hat(),T(beat),0.18,-0.3)
# 베이스 + 스탭 (마디마다 Am F C G)
for bar in range(0,8):            # 0~32박
    root,ch=PROG[bar%4]
    for e8 in range(8):
        b=bar*4+e8*0.5
        if 30<=b<32: continue
        add(bass_note(root+(12 if e8%2 else 0)),T(b),0.75)
    for e8 in (0,3,6):
        b=bar*4+e8*0.5
        if 30<=b<32: continue
        add(stab(ch,bright=2500+bar*400),T(b),0.42,0.15)
# 단어에 맞춘 블립 (인트로)
for i,b in enumerate(np.arange(0,2,0.5)): add(blip(76+[0,3,7,12][i]),T(b),0.35,0.3)
add(stab([69,72,76,81],0.6,6000),T(2),0.5)
# 카운터 구간 상승 아르페지오
arp=[69,72,76,79,81,84,88]
for i,b in enumerate(np.arange(27,30,0.25)): add(blip(arp[i%7]+(12 if i>14 else 0),0.09),T(b),0.25,-0.2)
# “소수의 기기” 브레이크: 낮은 패드
pad=sum(osc(NOTE(m),T(2),'saw') for m in (45,57,60,64)); pad=filt(pad,'low',1200)*np.sin(np.pi*np.linspace(0,1,len(pad)))**1.5*0.12
add(pad,T(30))
# 휘익 (전환)
for b in (7.65,23.65,31.65): add(whoosh(0.35),T(b),0.6)
for b in (10,14,36.5): add(whoosh(0.4),T(b),0.45)
# 카운트다운 5·4·3·2·1
for i,b in enumerate(range(32,37)):
    add(kick(),T(b),1.0); add(tom(90+i*12),T(b),0.6); add(blip(81+i*2,0.18),T(b),0.45)
    root,ch=PROG[i%4]; add(stab(ch,0.3,5000),T(b+0.5),0.35)
for b in np.arange(32,34,0.5): add(snare(),T(b+0.25),0.35)
for b in np.arange(34,36,0.25): add(snare(),T(b),0.3+0.1*(b-34))
for b in np.arange(36,36.75,0.125): add(snare(),T(b),0.55)
r_len=T(36.75)-T(32); rn=noise(r_len); t=np.arange(len(rn))/SR
riser=np.zeros_like(rn); steps=40
for i in range(steps):
    a,bb=int(i*len(rn)/steps),int((i+1)*len(rn)/steps); f=400+9000*(i/steps)**2; riser[a:bb]=filt(rn[a:bb],'band',(f,f*1.3),1)
riser*= (t/r_len)**2*0.5; add(riser,T(32))
# 쩍 — 음악이 끊기고 균열
add(crack(1.2),T(37),1.1)
add(buzz(),T(37)+0.85,0.8); add(buzz(0.6),T(37)+1.6,0.9)
# 어두운 드론 → 로고 균열 두 번 → 타이틀 히트
dr_t0=T(39); dr=osc(NOTE(33),TOTAL-dr_t0,'saw')+osc(NOTE(40),TOTAL-dr_t0,'saw')*0.6
dr=filt(dr,'low',300); k=np.linspace(0,1,len(dr)); dr*=np.minimum(1,k*6)*np.minimum(1,(1-k)*5)*0.18
add(dr,dr_t0)
add(crack(1.0),T(41)+1.5*B,1.0); add(crack(0.9),T(41)+2.5*B+0.05,0.95)
tt=T(41)+3.5*B
add(kick()*1.2,tt,1.0)
sw=sum(osc(NOTE(m),3.0,'saw') for m in (57,64,69,71,76)); sw=filt(sw,'low',2600)*np.minimum(1,np.linspace(0,1,len(sw))*3)*np.exp(-np.linspace(0,1,len(sw))*2.2)*0.1
add(sw,tt)
# 마스터
out[:,0]=reverb(out[:,0],mix=0.18); out[:,1]=reverb(out[:,1],mix=0.2)
out=np.tanh(out*0.9); out/=np.max(np.abs(out))/0.95
fl=int(0.6*SR); out[-fl:]*=np.linspace(1,0,fl)[:,None]
pcm=(out*32767).astype(np.int16)
with wave.open('music.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('dur',TOTAL)
