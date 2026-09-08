import { getRawDb } from '@/db/raw';
import { stages } from '@/lib/applications';
export async function GET() {
 try { const r=await getRawDb().prepare('SELECT *, next_date AS nextDate FROM applications ORDER BY updated DESC').all(); return Response.json(r.results); }
 catch { return Response.json({error:'지원 기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'},{status:500}); }
}
export async function POST(request:Request) {
 try {
  const a=await request.json() as Record<string,string>;
  const keys=['company','role','platform','url','applied','stage','requirements','expectations','notes','nextDate'];
  if(keys.some(k=>typeof a[k]!=='string'||a[k].length>30000)||!a.company.trim()||!a.role.trim()||!stages.includes(a.stage)) return Response.json({error:'회사, 포지션과 단계를 확인해 주세요.'},{status:400});
  if(a.url && !/^https?:\/\//i.test(a.url)) return Response.json({error:'공고 링크는 https:// 또는 http://로 시작해야 해요.'},{status:400});
  if(!/^\d{4}-\d{2}-\d{2}$/.test(a.applied)||(a.nextDate&&!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(a.nextDate))) return Response.json({error:'날짜를 확인해 주세요.'},{status:400});
  const db=getRawDb(), id=a.id||crypto.randomUUID(), now=new Date().toISOString();
  const old=await db.prepare('SELECT stage, history FROM applications WHERE id = ?').bind(id).first<{stage:string;history:string}>();
  const history=old?JSON.parse(old.history):[];
  if(!old||old.stage!==a.stage) history.push({stage:a.stage,date:now});
  await db.prepare('INSERT INTO applications (id,company,role,platform,url,applied,stage,requirements,expectations,notes,next_date,history,updated) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET company=excluded.company,role=excluded.role,platform=excluded.platform,url=excluded.url,applied=excluded.applied,stage=excluded.stage,requirements=excluded.requirements,expectations=excluded.expectations,notes=excluded.notes,next_date=excluded.next_date,history=excluded.history,updated=excluded.updated').bind(id,a.company.trim(),a.role.trim(),a.platform,a.url,a.applied,a.stage,a.requirements,a.expectations,a.notes,a.nextDate,JSON.stringify(history),now).run();
  return Response.json({id});
 } catch { return Response.json({error:'저장하지 못했어요. 입력 내용은 유지되니 다시 시도해 주세요.'},{status:500}); }
}

