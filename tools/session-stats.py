import json, glob, os
from compression import zstd
p = max(glob.glob(r"C:\Users\chuiz\.dsh\sessions\--D-0000DSH-qwen4-yihan--\*\session.v4.jsonl*"), key=os.path.getmtime)
data = zstd.decompress(open(p,"rb").read())
tot={}; n=0; per=[]
for line in data.splitlines():
    if not line.strip(): continue
    r=json.loads(line)
    if r.get("type")!="assistant/message": continue
    d=r.get("data",{})
    u=d.get("usage")
    if not u:
        chunks=[c.get("chunk",{}).get("usage") for c in d.get("stream",[]) if isinstance(c,dict)]
        chunks=[c for c in chunks if c]
        u=chunks[-1] if chunks else None
    if not u: continue
    n+=1; per.append(u)
    for k,v in u.items():
        if isinstance(v,(int,float)): tot[k]=tot.get(k,0)+v
print("model calls:",n)
for k in sorted(tot): print(f"{k}: {tot[k]:,}")
i,o,c=tot.get("inputTokens",0),tot.get("outputTokens",0),tot.get("cacheReadTokens",0)
print(f"input+output: {i+o:,}")
print(f"input+output+cacheRead: {i+o+c:,}")
print("sample usage:",json.dumps(per[0]))
json.dump({"calls":n,**{k:int(v) for k,v in tot.items()}},open("tools/usage.json","w"),indent=2)
