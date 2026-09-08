export const stages = ['지원 완료','서류 통과','1차 면접','2차·최종 면접','오퍼','종료'];
export type Application = { id:string; company:string; role:string; platform:string; url:string; applied:string; stage:string; requirements:string; expectations:string; notes:string; nextDate:string; history:string; updated:string };
export const today = () => { const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const blank = ():Application => ({id:'',company:'',role:'',platform:'LinkedIn',url:'',applied:today(),stage:stages[0],requirements:'',expectations:'',notes:'',nextDate:'',history:'[]',updated:''});
