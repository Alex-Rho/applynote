import { Application, stages } from './applications';
export const STORAGE_KEY = 'applynote.applications.v1';
export interface Store { getItem(key:string):string|null; setItem(key:string,value:string):void; }
const fields = ['id','company','role','platform','url','applied','stage','requirements','expectations','notes','nextDate','history','updated'] as const;
export function validateRecords(value:unknown):Application[] {
 if(!Array.isArray(value)||value.length>10000) throw Error('지원 기록 형식을 확인해 주세요.');
 const ids=new Set<string>();
 return value.map(item=>{
  if(!item||typeof item!=='object') throw Error('올바른 지원 기록 파일이 아니에요.');
  const r=item as Record<string,unknown>;
  if(fields.some(k=>typeof r[k]!=='string'||(r[k] as string).length>1000000)) throw Error('백업 파일의 필수 항목이 없거나 너무 길어요.');
  const a=Object.fromEntries(fields.map(k=>[k,r[k]])) as Application;
  if(!a.id||ids.has(a.id)||!a.company.trim()||!a.role.trim()||!stages.includes(a.stage)) throw Error('백업 파일에 잘못된 기록 또는 중복 ID가 있어요.');
  if(a.url&&!/^https?:\/\//i.test(a.url)) throw Error('백업 파일의 공고 링크가 올바르지 않아요.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(a.applied)||Number.isNaN(Date.parse(a.applied))||(a.nextDate&&(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(a.nextDate)||Number.isNaN(Date.parse(a.nextDate))))||Number.isNaN(Date.parse(a.updated))) throw Error('백업 파일의 날짜가 올바르지 않아요.');
  let history:unknown;try{history=JSON.parse(a.history);}catch{throw Error('단계 변경 이력이 손상되었어요.');}
  if(!Array.isArray(history)||history.some(h=>!h||!stages.includes(h.stage)||typeof h.date!=='string'||Number.isNaN(Date.parse(h.date)))) throw Error('단계 변경 이력이 올바르지 않아요.');
  ids.add(a.id);return a;
 });
}
export function readRecords(store:Store):Application[]{
 const raw=store.getItem(STORAGE_KEY);if(raw===null)return [];
 let data:unknown;try{data=JSON.parse(raw);}catch{throw Error('저장된 기록을 읽지 못했어요. 브라우저 데이터를 지우지 말고 백업을 확인해 주세요.');}
 return validateRecords(data);
}
export function writeRecords(store:Store,records:Application[]){
 const clean=validateRecords(records);
 try{store.setItem(STORAGE_KEY,JSON.stringify(clean));}catch{throw Error('브라우저 저장 공간이 부족하거나 저장이 차단됐어요. 입력 내용은 유지됩니다.');}
 return clean.sort((a,b)=>b.updated.localeCompare(a.updated));
}
export function saveRecord(store:Store,draft:Application):Application[]{
 const all=readRecords(store), old=all.find(a=>a.id===draft.id), now=new Date().toISOString();
 const history=old?JSON.parse(old.history):[];
 if(!old||old.stage!==draft.stage)history.push({stage:draft.stage,date:now});
 const a={...draft,id:draft.id||crypto.randomUUID(),company:draft.company.trim(),role:draft.role.trim(),history:JSON.stringify(history),updated:now};
 return writeRecords(store,[a,...all.filter(r=>r.id!==a.id)]);
}
export function makeBackup(records:Application[]){return JSON.stringify({app:'applynote',version:1,exportedAt:new Date().toISOString(),applications:validateRecords(records)},null,2);}
export function parseBackup(text:string){
 if(text.length>20_000_000)throw Error('백업 파일은 20MB 이하만 가져올 수 있어요.');
 let data;try{data=JSON.parse(text);}catch{throw Error('JSON 백업 파일을 선택해 주세요.');}
 if(data?.app!=='applynote'||data?.version!==1)throw Error('Applynote 백업 파일이 아니거나 지원하지 않는 버전이에요.');
 return validateRecords(data.applications);
}
export function mergeBackup(store:Store,incoming:Application[]){
 const current=readRecords(store), ids=new Set(current.map(a=>a.id)), added=validateRecords(incoming).filter(a=>!ids.has(a.id));
 return {records:writeRecords(store,[...current,...added]),added:added.length,skipped:incoming.length-added.length};
}
