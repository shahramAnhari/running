// Minimal Jalali (Persian) date utilities for month/year
// Converts between Gregorian and Jalali; includes formatting helpers.
(function(){
  function div(a,b){return Math.trunc(a/b);} // integer division
  function mod(a,b){return a - Math.trunc(a/b)*b;}

  function g2d(gy, gm, gd){
    var a = div(14 - gm, 12);
    gy = gy + 4800 - a;
    gm = gm + 12*a - 3;
    return gd + div(153*gm + 2, 5) + 365*gy + div(gy, 4) - div(gy, 100) + div(gy, 400) - 32045;
  }
  function d2g(jdn){
    var j = jdn + 32044;
    var g = div(j, 146097);
    var dg = mod(j, 146097);
    var c = div(div(dg, 36524) + 1, 4);
    var dc = dg - c*36524;
    var b = div(dc, 1461);
    var db = mod(dc, 1461);
    var a = div(div(db, 365) + 1, 4);
    var da = db - a*365;
    var y = g*400 + c*100 + b*4 + a;
    var m = div(da*5 + 308, 153) - 2;
    var d = da - Math.floor(((m + 4) * 153) / 5) + 122;
    var gd = Math.floor(d) + 1;
    var gm = mod(m + 2, 12) + 1;
    var gy = y - 4800 + div(m + 2, 12);
    return {gy: gy, gm: gm, gd: gd};
  }

  function jalCal(jy){
    var breaks=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];
    var bl=breaks.length;
    var gy=jy+621;
    var leapJ=-14;
    var jp=breaks[0], jm, jump, n, i;
    for(i=1;i<bl;i++){
      jm=breaks[i]; jump=jm-jp;
      if(jy<jm) break;
      leapJ+=div(jump,33)*8+div(mod(jump,33)+3,4);
      jp=jm;
    }
    n=jy-jp;
    leapJ+=div(n,33)*8+div(mod(n,33)+3,4);
    var leapG=div(gy,4)-div(gy,100)+div(gy,400);
    var march=20+leapJ-(leapG-150);
    if(jump-n===4 && mod(jump,33)===4) march+=1;
    var leap=((mod(n+1,33))-1)%4; if(leap===-1) leap=4;
    return {leap: leap, gy: gy, march: march};
  }

  function j2d(jy,jm,jd){
    var r=jalCal(jy);
    var jdn1f=g2d(r.gy,3,r.march);
    var day=jd-1;
    if(jm<=7) day+= (jm-1)*31; else day+= (jm-7)*30 + 6*31;
    return jdn1f + day;
  }
  function d2j(jdn){
    var g=d2g(jdn); var gy=g.gy, gm=g.gm, gd=g.gd;
    var jy=gy-621; var r=jalCal(jy); var jdn1f=g2d(r.gy,3,r.march);
    var k=jdn - jdn1f; var jm, jd;
    if(k>=0){
      if(k<186){ jm=1+div(k,31); jd=mod(k,31)+1; }
      else { k-=186; jm=7+div(k,30); jd=mod(k,30)+1; }
    } else {
      jy-=1; r=jalCal(jy); jdn1f=g2d(r.gy,3,r.march); k=jdn - jdn1f;
      if(k<186){ jm=1+div(k,31); jd=mod(k,31)+1; }
      else { k-=186; jm=7+div(k,30); jd=mod(k,30)+1; }
    }
    return {jy:jy, jm:jm, jd:jd};
  }

  function toJalali(gy,gm,gd){ return d2j(g2d(gy,gm,gd)); }
  function toGregorian(jy,jm,jd){ return d2g(j2d(jy,jm,jd)); }

  var monthNames = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  function pad2(n){ return (n<10?'0':'')+n; }
  function formatJalaliMonth(jy,jm){ return jy + ' ' + monthNames[jm-1]; }
  function formatJalaliYYYYMM(jy,jm){ return jy + '-' + pad2(jm); }
  function fromGregorianYYYYMMToJalaliLabel(gStr){
    if(!gStr) return '';
    var parts=gStr.split('-'); if(parts.length<2) return gStr;
    var gy=+parts[0], gm=+parts[1]; var j=toJalali(gy,gm,1);
    return formatJalaliMonth(j.jy,j.jm);
  }

  window.Jalali = {
    toJalali, toGregorian,
    formatJalaliMonth, formatJalaliYYYYMM,
    fromGregorianYYYYMMToJalaliLabel,
    monthNames
  };
})();
